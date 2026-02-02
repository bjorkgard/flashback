/**
 * Game Loop
 * 
 * Implements fixed 60Hz timestep game loop with accumulator pattern.
 * Manages game state, entity updates, collision detection, and rendering.
 * 
 * @module engine/loop
 */

import { InputSystem } from './input';
import { TimeSystem } from './time';
import type { Player, InputState } from '../entities/player';
import type { Enemy } from '../entities/enemy';
import type { Projectile } from '../entities/projectile';
import type { Tilemap } from '../level/tilemap';
import type { Camera } from '../render/camera';
import type { Renderer, HudData } from '../render/renderer';
import type { Entity } from '../entities/entity';
import { intersects } from '../math/rect';

/**
 * Game state modes
 */
export type GameMode = 'menu' | 'playing' | 'paused' | 'gameOver' | 'won';

/**
 * Game state interface
 */
export interface GameState {
  mode: GameMode;
  level: Tilemap;
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  camera: Camera;
  renderer: Renderer;
  input: InputSystem;
  time: TimeSystem;
  debugMode: boolean;
}

/**
 * Game loop class implementing fixed timestep updates
 * 
 * The game loop uses a fixed 60Hz timestep with accumulator pattern to ensure
 * deterministic physics and gameplay regardless of frame rate. Input is sampled
 * at each fixed timestep for consistency.
 * 
 * @example
 * ```typescript
 * const gameLoop = new GameLoop(canvas, levelData);
 * gameLoop.start();
 * 
 * // Later...
 * gameLoop.pause();
 * gameLoop.resume();
 * gameLoop.stop();
 * ```
 */
export class GameLoop {
  private state: GameState;
  private running: boolean = false;
  private animationFrameId: number | null = null;
  
  /**
   * Create a new game loop
   * @param state - Initial game state
   */
  constructor(state: GameState) {
    this.state = state;
    
    // Set up F3 debug toggle
    window.addEventListener('keydown', (e) => {
      if (e.code === 'F3') {
        e.preventDefault();
        this.state.debugMode = !this.state.debugMode;
      }
    });
  }
  
  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return;
    
    this.running = true;
    this.state.mode = 'playing';
    this.state.time.reset(performance.now());
    
    // Start the loop
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }
  
  /**
   * Stop the game loop
   */
  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Pause the game
   */
  pause(): void {
    if (this.state.mode === 'playing') {
      this.state.mode = 'paused';
    }
  }
  
  /**
   * Resume the game from pause
   */
  resume(): void {
    if (this.state.mode === 'paused') {
      this.state.mode = 'playing';
      // Reset time to avoid large delta
      this.state.time.reset(performance.now());
    }
  }
  
  /**
   * Main game loop with fixed timestep
   * @param currentTime - Current time from requestAnimationFrame
   */
  private loop(currentTime: number): void {
    if (!this.running) return;
    
    try {
      // Update time system
      const deltaTime = this.state.time.update(currentTime);
      
      // Add to accumulator
      this.state.time.accumulator += deltaTime;
      
      // Cap accumulator to prevent spiral of death
      const maxAccumulator = this.state.time.fixedDt * 5;
      if (this.state.time.accumulator > maxAccumulator) {
        console.warn('Game loop: Accumulator capped to prevent spiral of death');
        this.state.time.accumulator = maxAccumulator;
      }
      
      // Fixed timestep updates
      while (this.state.time.accumulator >= this.state.time.fixedDt) {
        this.fixedUpdate(this.state.time.getFixedDtSeconds());
        this.state.time.incrementFrame();
        this.state.time.accumulator -= this.state.time.fixedDt;
      }
      
      // Render with interpolation alpha
      const alpha = this.state.time.accumulator / this.state.time.fixedDt;
      this.render(alpha);
    } catch (error) {
      console.error('Game loop error:', error);
      // Continue running despite error
    }
    
    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }
  
  /**
   * Fixed timestep update for game logic
   * @param dt - Fixed delta time in seconds (1/60)
   */
  private fixedUpdate(dt: number): void {
    // Only update during playing state
    if (this.state.mode !== 'playing') return;
    
    try {
      // Sample input deterministically
      this.state.input.update();
      
      // Build input state for player
      const inputState: InputState = {
        left: this.state.input.isDown('KeyA') || this.state.input.isDown('ArrowLeft'),
        right: this.state.input.isDown('KeyD') || this.state.input.isDown('ArrowRight'),
        up: this.state.input.isDown('KeyW') || this.state.input.isDown('ArrowUp'),
        down: this.state.input.isDown('KeyS') || this.state.input.isDown('ArrowDown'),
        jump: this.state.input.isDown('Space'),
        shoot: this.state.input.isDown('KeyE'),
        roll: this.state.input.isDown('ShiftLeft') || this.state.input.isDown('ShiftRight'),
        jumpPressed: this.state.input.wasPressed('Space'),
        shootPressed: this.state.input.wasPressed('KeyE'),
        rollPressed: this.state.input.wasPressed('ShiftLeft') || this.state.input.wasPressed('ShiftRight'),
        upPressed: this.state.input.wasPressed('KeyW') || this.state.input.wasPressed('ArrowUp'),
      };
      
      // Update player
      this.state.player.update(dt, inputState, this.state.level);
      
      // Update enemies
      for (const enemy of this.state.enemies) {
        enemy.update(dt, this.state.player.pos, this.state.level);
      }
      
      // Update projectiles
      for (const projectile of this.state.projectiles) {
        projectile.update(dt);
      }
      
      // Remove inactive projectiles
      this.state.projectiles = this.state.projectiles.filter(p => p.active);
      
      // Remove inactive enemies
      this.state.enemies = this.state.enemies.filter(e => e.active);
      
      // Check collisions
      this.checkCollisions();
      
      // Update camera
      this.state.camera.setTarget(this.state.player.pos);
      this.state.camera.setTargetVelocity(this.state.player.vel);
      this.state.camera.update(dt);
      
      // Update tilemap animations
      this.state.level.update(dt);
      
      // Check win/lose conditions
      this.checkGameConditions();
    } catch (error) {
      console.error('Fixed update error:', error);
      // Continue despite error
    }
  }
  
  /**
   * Check collisions between entities
   */
  private checkCollisions(): void {
    // Projectile vs enemies
    for (const projectile of this.state.projectiles) {
      if (!projectile.active || projectile.owner !== 'player') continue;
      
      for (const enemy of this.state.enemies) {
        if (!enemy.active) continue;
        
        if (intersects(projectile.bounds, enemy.bounds)) {
          enemy.takeDamage(projectile.damage);
          projectile.destroy();
          break; // Projectile can only hit one enemy
        }
      }
    }
    
    // Projectile vs player
    for (const projectile of this.state.projectiles) {
      if (!projectile.active || projectile.owner !== 'enemy') continue;
      
      if (this.state.player.isInvulnerable()) {
        // Check if rolling with i-frames
        if (this.state.player.state === 'roll') {
          // Projectile is evaded
          if (intersects(projectile.bounds, this.state.player.bounds)) {
            projectile.destroy();
          }
        }
        continue;
      }
      
      if (intersects(projectile.bounds, this.state.player.bounds)) {
        this.state.player.takeDamage(projectile.damage);
        projectile.destroy();
      }
    }
    
    // Enemy vs player (melee collision - optional for future)
    // Not implemented yet
  }
  
  /**
   * Check win/lose conditions
   */
  private checkGameConditions(): void {
    // Check if player is dead
    if (this.state.player.health <= 0 || this.state.player.state === 'dead') {
      this.state.mode = 'gameOver';
      return;
    }
    
    // Check if player reached exit
    const playerTileX = Math.floor(this.state.player.pos.x / this.state.level.getTileSize());
    const playerTileY = Math.floor(this.state.player.pos.y / this.state.level.getTileSize());
    const tile = this.state.level.getTileAt(playerTileX, playerTileY);
    
    if (tile && tile.type === 'exit') {
      this.state.mode = 'won';
      return;
    }
  }
  
  /**
   * Render the game
   * @param _alpha - Interpolation alpha for smooth rendering (0-1) - currently unused
   */
  private render(_alpha: number): void {
    // Collect all entities for rendering
    const entities: Entity[] = [
      this.state.player,
      ...this.state.enemies,
      ...this.state.projectiles,
    ];
    
    // Build HUD data
    const hudData: HudData = {
      health: this.state.player.health,
      maxHealth: this.state.player.maxHealth,
      ammo: 999, // Unlimited for now
    };
    
    // Update renderer's camera to match game camera
    const rendererCamera = this.state.renderer.getCamera();
    rendererCamera.x = this.state.camera.x;
    rendererCamera.y = this.state.camera.y;
    
    // Render the frame
    this.state.renderer.render(
      this.state.level,
      entities,
      hudData
    );
    
    // TODO: Render debug overlay if enabled
    // Debug info can be logged to console for now
    if (this.state.debugMode) {
      // Log debug info periodically (every 60 frames)
      if (this.state.time.getFrameCount() % 60 === 0) {
        console.log(this.getDebugInfo());
      }
    }
  }
  
  /**
   * Get debug information for overlay
   */
  private getDebugInfo(): string {
    const fps = Math.round(1000 / this.state.time.getDeltaTime());
    const playerState = this.state.player.state;
    const playerPos = `(${Math.floor(this.state.player.pos.x)}, ${Math.floor(this.state.player.pos.y)})`;
    const playerVel = `(${Math.floor(this.state.player.vel.x)}, ${Math.floor(this.state.player.vel.y)})`;
    
    return `FPS: ${fps}\nState: ${playerState}\nPos: ${playerPos}\nVel: ${playerVel}\nFrame: ${this.state.time.getFrameCount()}`;
  }
  
  /**
   * Get current game mode
   */
  getMode(): GameMode {
    return this.state.mode;
  }
  
  /**
   * Set game mode
   * @param mode - New game mode
   */
  setMode(mode: GameMode): void {
    this.state.mode = mode;
    
    // Reset time when transitioning to playing
    if (mode === 'playing') {
      this.state.time.reset(performance.now());
    }
  }
  
  /**
   * Get current game state (for external access)
   */
  getState(): GameState {
    return this.state;
  }
}

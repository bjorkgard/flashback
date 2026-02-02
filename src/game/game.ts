/**
 * Game class - Main game controller
 * 
 * Manages game initialization, lifecycle, and state transitions.
 * Provides a high-level interface for React integration.
 * 
 * @module game
 */

import { GameLoop, type GameState, type GameMode } from './engine/loop';
import { InputSystem } from './engine/input';
import { TimeSystem } from './engine/time';
import { Renderer } from './render/renderer';
import { Camera } from './render/camera';
import { Tilemap } from './level/tilemap';
import { Player } from './entities/player';
import { Enemy } from './entities/enemy';
import type { Projectile } from './entities/projectile';
import type { LevelData } from './level/levelTypes';
import { vec2 } from './math/vec2';
import { rect } from './math/rect';

/**
 * Game class that manages the entire game lifecycle
 * 
 * Provides methods to start, stop, pause, and resume the game.
 * Handles initialization of all game systems and entities.
 * 
 * @example
 * ```typescript
 * const game = new Game(canvas, levelData);
 * game.start();
 * 
 * // Later...
 * game.pause();
 * game.resume();
 * game.stop();
 * ```
 */
export class Game {
  private gameLoop: GameLoop;
  private gameState: GameState;
  private levelData: LevelData;
  
  /**
   * Create a new Game instance
   * @param canvas - The canvas element to render to
   * @param levelData - The level data to load
   */
  constructor(canvas: HTMLCanvasElement, levelData: LevelData) {
    this.levelData = levelData;
    
    // Initialize all game systems
    this.gameState = this.initializeGameState(canvas, levelData);
    
    // Create game loop
    this.gameLoop = new GameLoop(this.gameState);
  }
  
  /**
   * Initialize game state with all systems and entities
   * @param canvas - The canvas element to render to
   * @param levelData - The level data to load
   * @returns Initialized game state
   */
  private initializeGameState(canvas: HTMLCanvasElement, levelData: LevelData): GameState {
    // Create renderer
    const renderer = new Renderer({
      internalWidth: 384,
      internalHeight: 216,
      targetCanvas: canvas,
    });
    
    // Create camera
    const camera = new Camera(384, 216);
    camera.setBounds(rect(
      levelData.bounds.x,
      levelData.bounds.y,
      levelData.bounds.w,
      levelData.bounds.h
    ));
    
    // Create input system
    const input = new InputSystem();
    
    // Create time system
    const time = new TimeSystem();
    
    // Load level
    const level = new Tilemap(levelData);
    
    // Create player
    const player = new Player(
      levelData.playerSpawn.x,
      levelData.playerSpawn.y
    );
    
    // Create enemies
    const enemies: Enemy[] = levelData.enemies.map(enemyData => {
      return new Enemy(
        enemyData.pos.x,
        enemyData.pos.y,
        enemyData.type,
        enemyData.patrolWaypoints?.map(wp => vec2(wp.x, wp.y)) || []
      );
    });
    
    // Initialize projectiles array
    const projectiles: Projectile[] = [];
    
    return {
      mode: 'menu',
      level,
      player,
      enemies,
      projectiles,
      camera,
      renderer,
      input,
      time,
      debugMode: false,
    };
  }
  
  /**
   * Start the game
   * Begins the game loop and transitions to playing state
   */
  start(): void {
    this.gameLoop.start();
  }
  
  /**
   * Stop the game
   * Halts the game loop completely
   */
  stop(): void {
    this.gameLoop.stop();
  }
  
  /**
   * Pause the game
   * Pauses game logic but keeps the loop running
   */
  pause(): void {
    this.gameLoop.pause();
  }
  
  /**
   * Resume the game from pause
   * Resumes game logic execution
   */
  resume(): void {
    this.gameLoop.resume();
  }
  
  /**
   * Reset the game to initial state
   * Reloads the level and resets all entities
   */
  reset(): void {
    // Stop current game loop
    this.gameLoop.stop();
    
    // Get the canvas from the renderer
    const canvas = this.gameState.renderer.getCanvas();
    
    // Reinitialize game state
    this.gameState = this.initializeGameState(canvas, this.levelData);
    
    // Create new game loop
    this.gameLoop = new GameLoop(this.gameState);
  }
  
  /**
   * Get current game mode
   * @returns Current game mode (menu, playing, paused, gameOver, won)
   */
  getMode(): GameMode {
    return this.gameLoop.getMode();
  }
  
  /**
   * Set game mode
   * @param mode - New game mode
   */
  setMode(mode: GameMode): void {
    this.gameLoop.setMode(mode);
  }
  
  /**
   * Get the game state (for debugging or external access)
   * @returns Current game state
   */
  getState(): GameState {
    return this.gameState;
  }
}

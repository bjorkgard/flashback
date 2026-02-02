/**
 * Player entity with physics-based movement and state machine
 * 
 * Implements weighty cinematic platformer movement with:
 * - Momentum-based physics with turn-in deceleration
 * - Landing recovery and committed rolls
 * - Ledge grabbing and climbing
 * - Combat with shooting and invulnerability
 * 
 * The player uses a state machine to manage complex behavior transitions
 * and ensure deliberate, skill-based gameplay.
 */

import type { Entity } from './entity';
import type { Vec2 } from '../math/vec2';
import type { Rect } from '../math/rect';
import type { Tilemap } from '../level/tilemap';
import { vec2, add, mul } from '../math/vec2';
import { rect } from '../math/rect';
import { checkTileCollision, checkLadderOverlap, checkLedgeGrab } from '../level/collision';

/**
 * Player state types for state machine
 */
export type PlayerState = 
  | 'idle' | 'walk' | 'run' | 'jump' | 'fall' 
  | 'landRecover' | 'crouch' | 'roll' | 'hang' 
  | 'climbUp' | 'climbDown' | 'aim' | 'shoot' 
  | 'hurt' | 'dead';

/**
 * Input state interface for player control
 */
export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  shoot: boolean;
  roll: boolean;
  jumpPressed: boolean;  // Just pressed this frame
  shootPressed: boolean; // Just pressed this frame
  rollPressed: boolean;  // Just pressed this frame
  upPressed: boolean;    // Just pressed this frame
}

/**
 * Physics constants for player movement
 */
const PHYSICS = {
  // Movement speeds
  WALK_SPEED: 60,        // px/s
  RUN_SPEED: 120,        // px/s
  CLIMB_SPEED: 40,       // px/s
  
  // Jump and gravity
  JUMP_VELOCITY: -240,   // px/s (negative is up)
  GRAVITY: 800,          // px/s²
  
  // Friction
  FRICTION: 0.85,        // Ground friction multiplier
  AIR_FRICTION: 0.98,    // Air resistance
  TURN_ACCEL: 0.6,       // Acceleration when reversing direction
  
  // State durations
  LAND_RECOVER_DURATION: 150,    // ms
  ROLL_DURATION: 400,            // ms
  ROLL_IFRAME_DURATION: 280,     // ms (70% of roll)
  SHOOT_COOLDOWN: 300,           // ms
  INVULN_DURATION: 1000,         // ms after hit
  HURT_DURATION: 200,            // ms
  
  // Dimensions
  WIDTH: 24,   // px
  HEIGHT: 40,  // px
};

/**
 * Player entity class
 * 
 * Represents the player-controlled character with full physics simulation,
 * state machine, and combat capabilities.
 */
export class Player implements Entity {
  pos: Vec2;
  vel: Vec2;
  bounds: Rect;
  active: boolean;
  
  // State machine
  state: PlayerState;
  facing: -1 | 1; // -1 = left, 1 = right
  
  // Health and damage
  health: number;
  maxHealth: number;
  invulnFrames: number;  // ms remaining
  
  // State timers
  landRecoverTimer: number;  // ms remaining
  rollTimer: number;         // ms remaining
  shootCooldown: number;     // ms remaining
  hurtTimer: number;         // ms remaining
  
  // Animation
  animTimer: number;   // ms accumulated
  animFrame: number;   // Current frame index
  
  // Ground detection
  grounded: boolean;
  
  // Shoot tracking
  private projectileFired: boolean; // Track if projectile created for current shoot
  
  // Projectile creation callback
  private onShoot?: (pos: Vec2, direction: Vec2) => void;
  
  /**
   * Create a new player entity
   * @param x - Starting X position
   * @param y - Starting Y position
   */
  constructor(x: number, y: number) {
    this.pos = vec2(x, y);
    this.vel = vec2(0, 0);
    this.bounds = rect(x, y, PHYSICS.WIDTH, PHYSICS.HEIGHT);
    this.active = true;
    
    this.state = 'idle';
    this.facing = 1;
    
    this.health = 3;
    this.maxHealth = 3;
    this.invulnFrames = 0;
    
    this.landRecoverTimer = 0;
    this.rollTimer = 0;
    this.shootCooldown = 0;
    this.hurtTimer = 0;
    
    this.animTimer = 0;
    this.animFrame = 0;
    
    this.grounded = false;
    this.projectileFired = false;
  }
  
  /**
   * Update player for one fixed timestep
   * @param dt - Delta time in seconds
   * @param input - Current input state
   * @param tilemap - Level tilemap for collision
   */
  update(dt: number, input?: InputState, tilemap?: Tilemap): void {
    if (!this.active || this.state === 'dead') return;
    
    // Update timers
    this.updateTimers(dt);
    
    // Handle state-specific logic
    if (input && tilemap) {
      this.handleState(dt, input, tilemap);
    }
    
    // Apply physics
    this.applyPhysics(dt, tilemap);
    
    // Update animation
    this.updateAnimation(dt);
  }
  
  /**
   * Update all timers
   */
  private updateTimers(dt: number): void {
    const dtMs = dt * 1000;
    
    if (this.invulnFrames > 0) {
      this.invulnFrames = Math.max(0, this.invulnFrames - dtMs);
    }
    
    if (this.landRecoverTimer > 0) {
      this.landRecoverTimer = Math.max(0, this.landRecoverTimer - dtMs);
    }
    
    if (this.rollTimer > 0) {
      this.rollTimer = Math.max(0, this.rollTimer - dtMs);
    }
    
    if (this.shootCooldown > 0) {
      this.shootCooldown = Math.max(0, this.shootCooldown - dtMs);
    }
    
    if (this.hurtTimer > 0) {
      this.hurtTimer = Math.max(0, this.hurtTimer - dtMs);
    }
  }
  
  /**
   * Handle state-specific behavior
   */
  private handleState(_dt: number, input: InputState, tilemap: Tilemap): void {
    switch (this.state) {
      case 'idle':
        this.handleIdle(input, tilemap);
        break;
      case 'walk':
        this.handleWalk(input, tilemap);
        break;
      case 'run':
        this.handleRun(input, tilemap);
        break;
      case 'jump':
        this.handleJump(input, tilemap);
        break;
      case 'fall':
        this.handleFall(input, tilemap);
        break;
      case 'landRecover':
        this.handleLandRecover(input);
        break;
      case 'roll':
        this.handleRoll(input);
        break;
      case 'hang':
        this.handleHang(input, tilemap);
        break;
      case 'climbUp':
        this.handleClimbUp(input);
        break;
      case 'climbDown':
        this.handleClimbDown(input, tilemap);
        break;
      case 'aim':
        this.handleAim(input);
        break;
      case 'shoot':
        this.handleShoot(input);
        break;
      case 'hurt':
        this.handleHurt();
        break;
    }
  }
  
  /**
   * Handle idle state
   */
  private handleIdle(input: InputState, _tilemap: Tilemap): void {
    // Update facing direction based on input
    if (input.left) {
      this.facing = -1;
    } else if (input.right) {
      this.facing = 1;
    }
    
    // Check for state transitions
    if (!this.grounded) {
      this.state = 'fall';
      return;
    }
    
    if (input.rollPressed) {
      this.state = 'roll';
      this.rollTimer = PHYSICS.ROLL_DURATION;
      return;
    }
    
    if (input.shootPressed && this.shootCooldown <= 0) {
      this.state = 'shoot';
      this.shootCooldown = PHYSICS.SHOOT_COOLDOWN;
      this.projectileFired = false; // Reset flag for new shoot
      return;
    }
    
    if (input.jumpPressed && this.grounded) {
      this.state = 'jump';
      this.vel.y = PHYSICS.JUMP_VELOCITY;
      return;
    }
    
    if (input.left || input.right) {
      this.state = 'walk';
      return;
    }
  }
  
  /**
   * Handle walk state
   */
  private handleWalk(input: InputState, _tilemap: Tilemap): void {
    if (!this.grounded) {
      this.state = 'fall';
      return;
    }
    
    if (input.jumpPressed) {
      this.state = 'jump';
      this.vel.y = PHYSICS.JUMP_VELOCITY;
      return;
    }
    
    // Handle horizontal movement
    const moveDir = input.right ? 1 : input.left ? -1 : 0;
    
    if (moveDir === 0) {
      this.state = 'idle';
      return;
    }
    
    // Update facing direction (moveDir is guaranteed to be -1 or 1 here)
    this.facing = moveDir as -1 | 1;
    
    // Apply movement with turn-in deceleration
    const targetSpeed = PHYSICS.WALK_SPEED * moveDir;
    const accel = this.isTurningAround(moveDir) ? PHYSICS.TURN_ACCEL : 1.0;
    this.vel.x += (targetSpeed - this.vel.x) * accel * 0.3;
  }
  
  /**
   * Handle run state
   */
  private handleRun(input: InputState, _tilemap: Tilemap): void {
    if (!this.grounded) {
      this.state = 'fall';
      return;
    }
    
    if (input.jumpPressed) {
      this.state = 'jump';
      this.vel.y = PHYSICS.JUMP_VELOCITY;
      return;
    }
    
    // Handle horizontal movement
    const moveDir = input.right ? 1 : input.left ? -1 : 0;
    
    if (moveDir === 0) {
      this.state = 'idle';
      return;
    }
    
    // Update facing direction (moveDir is guaranteed to be -1 or 1 here)
    this.facing = moveDir as -1 | 1;
    
    // Apply movement with turn-in deceleration
    const targetSpeed = PHYSICS.RUN_SPEED * moveDir;
    const accel = this.isTurningAround(moveDir) ? PHYSICS.TURN_ACCEL : 1.0;
    this.vel.x += (targetSpeed - this.vel.x) * accel * 0.3;
  }
  
  /**
   * Handle jump state
   */
  private handleJump(input: InputState, _tilemap: Tilemap): void {
    // Transition to fall when moving downward
    if (this.vel.y > 0) {
      this.state = 'fall';
      return;
    }
    
    // Air control
    const moveDir = input.right ? 1 : input.left ? -1 : 0;
    if (moveDir !== 0) {
      this.facing = moveDir as -1 | 1;
      const targetSpeed = PHYSICS.WALK_SPEED * moveDir;
      this.vel.x += (targetSpeed - this.vel.x) * 0.1;
    }
  }
  
  /**
   * Handle fall state
   */
  private handleFall(input: InputState, tilemap: Tilemap): void {
    // Check for landing
    if (this.grounded) {
      this.state = 'landRecover';
      this.landRecoverTimer = PHYSICS.LAND_RECOVER_DURATION;
      return;
    }
    
    // Check for ledge grab
    const ledgeGrab = checkLedgeGrab(this.bounds, this.vel, tilemap);
    if (ledgeGrab.canGrab && input.jump) {
      this.state = 'hang';
      this.pos.x = ledgeGrab.ledgePos.x;
      this.pos.y = ledgeGrab.ledgePos.y;
      this.vel.x = 0;
      this.vel.y = 0;
      return;
    }
    
    // Air control
    const moveDir = input.right ? 1 : input.left ? -1 : 0;
    if (moveDir !== 0) {
      this.facing = moveDir as -1 | 1;
      const targetSpeed = PHYSICS.WALK_SPEED * moveDir;
      this.vel.x += (targetSpeed - this.vel.x) * 0.1;
    }
  }
  
  /**
   * Handle land recover state
   */
  private handleLandRecover(input: InputState): void {
    // Reduced horizontal control during recovery
    const moveDir = input.right ? 1 : input.left ? -1 : 0;
    if (moveDir !== 0) {
      this.facing = moveDir as -1 | 1;
      const targetSpeed = PHYSICS.WALK_SPEED * moveDir * 0.5; // 50% speed
      this.vel.x += (targetSpeed - this.vel.x) * 0.2;
    }
    
    // Jump input is locked during recovery
    // (handled by not checking input.jumpPressed)
    
    // Transition to idle when timer expires (if still grounded)
    if (this.landRecoverTimer <= 0) {
      this.state = 'idle';
    }
  }
  
  /**
   * Handle roll state
   */
  private handleRoll(_input: InputState): void {
    // Roll is committed - no state changes until complete
    // Move in facing direction
    this.vel.x = this.facing * PHYSICS.RUN_SPEED * 1.2; // Slightly faster than run
    
    // Transition to idle when timer expires
    if (this.rollTimer <= 0) {
      this.state = 'idle';
    }
  }
  
  /**
   * Handle hang state
   */
  private handleHang(input: InputState, _tilemap: Tilemap): void {
    // No velocity while hanging
    this.vel.x = 0;
    this.vel.y = 0;
    
    // Climb up
    if (input.upPressed) {
      this.state = 'climbUp';
      return;
    }
    
    // Drop down
    if (input.down || input.jumpPressed) {
      this.state = 'fall';
      return;
    }
  }
  
  /**
   * Handle climb up state
   */
  private handleClimbUp(_input: InputState): void {
    // Move upward during climb animation
    this.vel.x = 0;
    this.vel.y = -PHYSICS.CLIMB_SPEED;
    
    // Transition to idle after animation completes
    // For now, use a simple timer
    if (this.animFrame >= 3) {
      this.state = 'idle';
      this.animFrame = 0;
    }
  }
  
  /**
   * Handle climb down state (on ladders)
   */
  private handleClimbDown(input: InputState, tilemap: Tilemap): void {
    // Check if still on ladder
    const onLadder = checkLadderOverlap(this.bounds, tilemap);
    if (!onLadder) {
      this.state = 'fall';
      return;
    }
    
    // Move downward
    this.vel.x = 0;
    this.vel.y = PHYSICS.CLIMB_SPEED;
    
    // Transition to idle if not pressing down
    if (!input.down) {
      this.state = 'idle';
    }
  }
  
  /**
   * Handle aim state
   */
  private handleAim(input: InputState): void {
    // Aim state is currently unused - shoot directly from idle/walk
    // This is here for future expansion
    if (input.shootPressed && this.shootCooldown <= 0) {
      this.state = 'shoot';
      this.shootCooldown = PHYSICS.SHOOT_COOLDOWN;
    } else {
      this.state = 'idle';
    }
  }
  
  /**
   * Handle shoot state
   */
  private handleShoot(_input: InputState): void {
    // Create projectile on first frame (only once per shoot)
    if (this.animFrame === 0 && this.onShoot && !this.projectileFired) {
      // Shoot in facing direction
      const shootPos = vec2(
        this.pos.x + (this.facing > 0 ? this.bounds.w : 0),
        this.pos.y + this.bounds.h / 2
      );
      const direction = vec2(this.facing, 0);
      this.onShoot(shootPos, direction);
      this.projectileFired = true; // Mark as fired
    }
    
    // Transition to idle after animation completes
    if (this.animFrame >= 2) {
      this.state = 'idle';
      this.animFrame = 0;
    }
  }
  
  /**
   * Handle hurt state
   */
  private handleHurt(): void {
    // Transition to idle or dead when timer expires
    if (this.hurtTimer <= 0) {
      if (this.health <= 0) {
        this.state = 'dead';
      } else {
        this.state = 'idle';
      }
    }
  }
  
  /**
   * Check if player is turning around (reversing direction)
   */
  private isTurningAround(moveDir: number): boolean {
    // Check if velocity and input have opposite signs
    return (this.vel.x > 0 && moveDir < 0) || (this.vel.x < 0 && moveDir > 0);
  }
  
  /**
   * Apply physics simulation
   */
  private applyPhysics(dt: number, tilemap?: Tilemap): void {
    if (!tilemap) return;
    
    // Validate and sanitize velocity
    this.vel = this.sanitizeVector(this.vel);
    this.pos = this.sanitizeVector(this.pos);
    
    // Apply gravity
    this.vel.y += PHYSICS.GRAVITY * dt;
    
    // Apply friction
    if (this.grounded) {
      this.vel.x *= PHYSICS.FRICTION;
    } else {
      this.vel.x *= PHYSICS.AIR_FRICTION;
    }
    
    // Update position
    const newPos = add(this.pos, mul(this.vel, dt));
    
    // Check X-axis collision
    this.bounds.x = newPos.x;
    const xCollision = checkTileCollision(this.bounds, this.vel, tilemap);
    if (xCollision.collided) {
      this.bounds.x -= xCollision.normal.x * xCollision.penetration;
      this.vel.x = 0;
    }
    
    // Check Y-axis collision
    this.bounds.y = newPos.y;
    const yCollision = checkTileCollision(this.bounds, this.vel, tilemap);
    if (yCollision.collided) {
      this.bounds.y -= yCollision.normal.y * yCollision.penetration;
      this.vel.y = 0;
      
      // Check if landed on ground
      if (yCollision.normal.y < 0) {
        this.grounded = true;
      }
    } else {
      this.grounded = false;
    }
    
    // Update position from bounds
    this.pos.x = this.bounds.x;
    this.pos.y = this.bounds.y;
    
    // Final validation
    this.vel = this.sanitizeVector(this.vel);
    this.pos = this.sanitizeVector(this.pos);
  }
  
  /**
   * Sanitize a vector to prevent NaN/Infinity
   */
  private sanitizeVector(v: Vec2): Vec2 {
    const MAX_VALUE = 10000;
    
    let x = v.x;
    let y = v.y;
    
    // Check for NaN
    if (isNaN(x)) {
      console.error('Player: NaN detected in vector.x, resetting to 0');
      x = 0;
    }
    if (isNaN(y)) {
      console.error('Player: NaN detected in vector.y, resetting to 0');
      y = 0;
    }
    
    // Check for Infinity
    if (!isFinite(x)) {
      console.error('Player: Infinity detected in vector.x, clamping');
      x = Math.sign(x) * MAX_VALUE;
    }
    if (!isFinite(y)) {
      console.error('Player: Infinity detected in vector.y, clamping');
      y = Math.sign(y) * MAX_VALUE;
    }
    
    // Clamp to safe bounds
    x = Math.max(-MAX_VALUE, Math.min(MAX_VALUE, x));
    y = Math.max(-MAX_VALUE, Math.min(MAX_VALUE, y));
    
    return vec2(x, y);
  }
  
  /**
   * Update animation frame
   */
  private updateAnimation(dt: number): void {
    // Animation timing based on state
    const frameTimings: Record<PlayerState, number> = {
      idle: 180,
      walk: 90,
      run: 70,
      jump: 100,
      fall: 120,
      landRecover: 140,
      crouch: 200,
      roll: 60,
      hang: 200,
      climbUp: 110,
      climbDown: 110,
      aim: 200,
      shoot: 70,
      hurt: 90,
      dead: 0,
    };
    
    const frameDuration = frameTimings[this.state];
    if (frameDuration === 0) return;
    
    this.animTimer += dt * 1000;
    if (this.animTimer >= frameDuration) {
      this.animTimer = 0;
      this.animFrame++;
      
      // Loop animation (frame counts vary by state)
      const frameCounts: Record<PlayerState, number> = {
        idle: 4,
        walk: 6,
        run: 6,
        jump: 2,
        fall: 2,
        landRecover: 2,
        crouch: 1,
        roll: 8,
        hang: 2,
        climbUp: 4,
        climbDown: 4,
        aim: 1,
        shoot: 3,
        hurt: 2,
        dead: 1,
      };
      
      if (this.animFrame >= frameCounts[this.state]) {
        this.animFrame = 0;
      }
    }
  }
  
  /**
   * Render player to canvas
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    
    // Simple rectangle rendering for now
    // TODO: Replace with procedural sprite generation
    
    // Flash white during invulnerability
    if (this.invulnFrames > 0 && Math.floor(this.invulnFrames / 100) % 2 === 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#00aaff';
    }
    
    ctx.fillRect(
      Math.floor(this.bounds.x),
      Math.floor(this.bounds.y),
      this.bounds.w,
      this.bounds.h
    );
    
    // Draw facing direction indicator
    ctx.fillStyle = '#ffff00';
    const indicatorX = this.facing > 0 
      ? this.bounds.x + this.bounds.w 
      : this.bounds.x - 4;
    ctx.fillRect(indicatorX, this.bounds.y + 10, 4, 4);
  }
  
  /**
   * Take damage
   * @param amount - Damage amount
   */
  takeDamage(amount: number): void {
    if (this.invulnFrames > 0 || this.state === 'dead') return;
    
    // Check if rolling with i-frames
    if (this.state === 'roll' && this.rollTimer > (PHYSICS.ROLL_DURATION - PHYSICS.ROLL_IFRAME_DURATION)) {
      // Evaded! (within first 70% of roll)
      return;
    }
    
    this.health = Math.max(0, this.health - amount);
    this.invulnFrames = PHYSICS.INVULN_DURATION;
    this.hurtTimer = PHYSICS.HURT_DURATION;
    this.state = 'hurt';
  }
  
  /**
   * Set the callback for when player shoots
   * @param callback - Function to call with projectile position and direction
   */
  setShootCallback(callback: (pos: Vec2, direction: Vec2) => void): void {
    this.onShoot = callback;
  }
  
  /**
   * Check if player is currently invulnerable
   */
  isInvulnerable(): boolean {
    if (this.invulnFrames > 0) return true;
    if (this.state === 'roll' && this.rollTimer > (PHYSICS.ROLL_DURATION - PHYSICS.ROLL_IFRAME_DURATION)) {
      return true;
    }
    return false;
  }
}

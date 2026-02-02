/**
 * Enemy entity with AI behavior and combat
 * 
 * Implements enemy AI with:
 * - Patrol behavior with waypoint following
 * - Line-of-sight detection using raycasting
 * - Alert state with player tracking
 * - Shooting behavior with cooldown
 * - Health and damage handling
 * - Support for humanoid and drone types
 * 
 * The enemy uses a state machine to manage behavior transitions
 * and provide dynamic, challenging encounters.
 */

import type { Entity } from './entity';
import type { Vec2 } from '../math/vec2';
import type { Rect } from '../math/rect';
import type { Tilemap } from '../level/tilemap';
import { vec2, add, mul, sub, length } from '../math/vec2';
import { rect } from '../math/rect';
import { checkTileCollision } from '../level/collision';
import { raycastTiles } from '../level/raycast';

/**
 * Enemy type variants
 */
export type EnemyType = 'humanoid' | 'drone';

/**
 * Enemy state types for state machine
 */
export type EnemyState = 'patrol' | 'alert' | 'shoot' | 'hurt' | 'dead';

/**
 * Physics constants for enemy movement
 */
const PHYSICS = {
  // Movement speeds
  PATROL_SPEED: 40,      // px/s
  
  // Gravity (humanoid only)
  GRAVITY: 800,          // px/s²
  
  // Detection and combat
  DETECTION_RANGE: 200,  // px
  SHOOT_RANGE: 150,      // px
  SHOOT_COOLDOWN: 1500,  // ms
  
  // State durations
  HURT_DURATION: 200,    // ms
  
  // Dimensions
  HUMANOID_WIDTH: 22,    // px
  HUMANOID_HEIGHT: 38,   // px
  DRONE_WIDTH: 26,       // px
  DRONE_HEIGHT: 18,      // px
  
  // Waypoint tolerance
  WAYPOINT_TOLERANCE: 5, // px
};

/**
 * Enemy entity class
 * 
 * Represents an AI-controlled hostile entity with patrol, detection,
 * and combat capabilities. Supports both ground-based humanoid and
 * flying drone types.
 */
export class Enemy implements Entity {
  pos: Vec2;
  vel: Vec2;
  bounds: Rect;
  active: boolean;
  
  // Enemy configuration
  type: EnemyType;
  
  // State machine
  state: EnemyState;
  facing: -1 | 1; // -1 = left, 1 = right
  
  // Health and damage
  health: number;
  maxHealth: number;
  
  // Patrol behavior
  patrolWaypoints: Vec2[];
  currentWaypoint: number;
  
  // Detection and combat
  detectionRange: number;
  shootRange: number;
  shootCooldown: number;  // ms remaining
  
  // State timers
  hurtTimer: number;      // ms remaining
  
  // Animation
  animTimer: number;      // ms accumulated
  animFrame: number;      // Current frame index
  
  // Ground detection (humanoid only)
  // private grounded: boolean;
  
  // Target tracking
  private targetPos: Vec2 | null;
  
  // Shoot tracking
  private projectileFired: boolean; // Track if projectile created for current shoot
  
  // Projectile creation callback
  private onShoot?: (pos: Vec2, direction: Vec2) => void;
  
  /**
   * Create a new enemy entity
   * @param x - Starting X position
   * @param y - Starting Y position
   * @param type - Enemy type (humanoid or drone)
   * @param waypoints - Patrol waypoints (optional)
   */
  constructor(
    x: number,
    y: number,
    type: EnemyType,
    waypoints?: Vec2[]
  ) {
    this.pos = vec2(x, y);
    this.vel = vec2(0, 0);
    
    // Set dimensions based on type
    const width = type === 'humanoid' ? PHYSICS.HUMANOID_WIDTH : PHYSICS.DRONE_WIDTH;
    const height = type === 'humanoid' ? PHYSICS.HUMANOID_HEIGHT : PHYSICS.DRONE_HEIGHT;
    this.bounds = rect(x, y, width, height);
    
    this.active = true;
    this.type = type;
    
    this.state = 'patrol';
    this.facing = 1;
    
    this.health = 3;
    this.maxHealth = 3;
    
    // Initialize patrol waypoints
    this.patrolWaypoints = waypoints && waypoints.length > 0 
      ? waypoints 
      : [vec2(x, y)]; // Default to starting position
    this.currentWaypoint = 0;
    
    this.detectionRange = PHYSICS.DETECTION_RANGE;
    this.shootRange = PHYSICS.SHOOT_RANGE;
    this.shootCooldown = 0;
    
    this.hurtTimer = 0;
    
    this.animTimer = 0;
    this.animFrame = 0;
    
    // this.grounded = false;
    this.targetPos = null;
    this.projectileFired = false;
  }
  
  /**
   * Update enemy for one fixed timestep
   * @param dt - Delta time in seconds
   * @param playerPos - Player position for detection (optional)
   * @param tilemap - Level tilemap for collision (optional)
   */
  update(dt: number, playerPos?: Vec2, tilemap?: Tilemap): void {
    if (!this.active || this.state === 'dead') return;
    
    // Update timers
    this.updateTimers(dt);
    
    // Handle state-specific logic
    if (playerPos && tilemap) {
      this.handleState(dt, playerPos, tilemap);
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
  private handleState(dt: number, playerPos: Vec2, tilemap: Tilemap): void {
    switch (this.state) {
      case 'patrol':
        this.handlePatrol(dt, playerPos, tilemap);
        break;
      case 'alert':
        this.handleAlert(dt, playerPos, tilemap);
        break;
      case 'shoot':
        this.handleShoot(dt, playerPos);
        break;
      case 'hurt':
        this.handleHurt();
        break;
    }
  }
  
  /**
   * Handle patrol state
   */
  private handlePatrol(_dt: number, playerPos: Vec2, tilemap: Tilemap): void {
    // Check for player detection
    const distanceToPlayer = length(sub(playerPos, this.pos));
    
    if (distanceToPlayer <= this.detectionRange) {
      // Check line of sight
      const raycast = raycastTiles(this.pos, playerPos, tilemap);
      
      if (!raycast.hit) {
        // Can see player - transition to alert
        this.state = 'alert';
        this.targetPos = playerPos;
        return;
      }
    }
    
    // Follow patrol waypoints
    if (this.patrolWaypoints.length > 1) {
      // Multiple waypoints - patrol between them
      const targetWaypoint = this.patrolWaypoints[this.currentWaypoint];
      const toWaypoint = sub(targetWaypoint, this.pos);
      const distanceToWaypoint = length(toWaypoint);
      
      // Check if reached waypoint
      if (distanceToWaypoint <= PHYSICS.WAYPOINT_TOLERANCE) {
        // Move to next waypoint
        this.currentWaypoint = (this.currentWaypoint + 1) % this.patrolWaypoints.length;
      } else {
        // Move toward waypoint
        const direction = toWaypoint.x > 0 ? 1 : -1;
        this.facing = direction as -1 | 1;
        
        if (this.type === 'humanoid') {
          // Ground-based movement
          this.vel.x = direction * PHYSICS.PATROL_SPEED;
        } else {
          // Flying movement (drone)
          const normalizedDir = {
            x: toWaypoint.x / distanceToWaypoint,
            y: toWaypoint.y / distanceToWaypoint
          };
          this.vel.x = normalizedDir.x * PHYSICS.PATROL_SPEED;
          this.vel.y = normalizedDir.y * PHYSICS.PATROL_SPEED;
        }
      }
    } else {
      // Single waypoint or no waypoints - stay in place
      this.vel.x = 0;
      if (this.type === 'drone') {
        this.vel.y = 0;
      }
    }
  }
  
  /**
   * Handle alert state
   */
  private handleAlert(_dt: number, playerPos: Vec2, _tilemap: Tilemap): void {
    // Update target position
    this.targetPos = playerPos;
    
    // Face toward player
    const toPlayer = sub(playerPos, this.pos);
    this.facing = toPlayer.x > 0 ? 1 : -1;
    
    // Check if player is in shoot range
    const distanceToPlayer = length(toPlayer);
    
    if (distanceToPlayer <= this.shootRange && this.shootCooldown <= 0) {
      // Transition to shoot state
      this.state = 'shoot';
      this.shootCooldown = PHYSICS.SHOOT_COOLDOWN;
      this.animFrame = 0; // Reset animation for shoot
      this.projectileFired = false; // Reset projectile flag
      return;
    }
    
    // Check if lost line of sight
    const raycast = raycastTiles(this.pos, playerPos, _tilemap);
    
    if (raycast.hit || distanceToPlayer > this.detectionRange) {
      // Lost sight of player - return to patrol
      this.state = 'patrol';
      this.targetPos = null;
      return;
    }
    
    // Move toward player (but not too close)
    if (distanceToPlayer > this.shootRange * 0.8) {
      const direction = toPlayer.x > 0 ? 1 : -1;
      
      if (this.type === 'humanoid') {
        // Ground-based movement
        this.vel.x = direction * PHYSICS.PATROL_SPEED;
      } else {
        // Flying movement (drone)
        const normalizedDir = {
          x: toPlayer.x / distanceToPlayer,
          y: toPlayer.y / distanceToPlayer
        };
        this.vel.x = normalizedDir.x * PHYSICS.PATROL_SPEED;
        this.vel.y = normalizedDir.y * PHYSICS.PATROL_SPEED;
      }
    } else {
      // In range - stop moving
      this.vel.x = 0;
      if (this.type === 'drone') {
        this.vel.y = 0;
      }
    }
  }
  
  /**
   * Handle shoot state
   */
  private handleShoot(_dt: number, playerPos: Vec2): void {
    // Stop moving while shooting
    this.vel.x = 0;
    if (this.type === 'drone') {
      this.vel.y = 0;
    }
    
    // Face toward player
    const toPlayer = sub(playerPos, this.pos);
    this.facing = toPlayer.x > 0 ? 1 : -1;
    
    // Fire projectile on first frame (only once per shoot)
    if (this.animFrame === 0 && this.onShoot && !this.projectileFired) {
      // Calculate shoot position
      const shootPos = vec2(
        this.pos.x + (this.facing > 0 ? this.bounds.w : 0),
        this.pos.y + this.bounds.h / 2
      );
      
      // Calculate direction to player
      const distance = length(toPlayer);
      const direction = distance > 0 
        ? vec2(toPlayer.x / distance, toPlayer.y / distance)
        : vec2(this.facing, 0);
      
      this.onShoot(shootPos, direction);
      this.projectileFired = true; // Mark as fired
    }
    
    // Transition back to alert after animation completes
    if (this.animFrame >= 2) {
      this.state = 'alert';
      this.animFrame = 0;
    }
  }
  
  /**
   * Handle hurt state
   */
  private handleHurt(): void {
    // Transition to dead or alert when timer expires
    if (this.hurtTimer <= 0) {
      if (this.health <= 0) {
        this.state = 'dead';
        this.active = false; // Mark for removal
      } else {
        // Return to alert if we had a target, otherwise patrol
        this.state = this.targetPos ? 'alert' : 'patrol';
      }
    }
  }
  
  /**
   * Apply physics simulation
   */
  private applyPhysics(dt: number, tilemap?: Tilemap): void {
    if (!tilemap) return;
    
    // Apply gravity (humanoid only)
    if (this.type === 'humanoid') {
      this.vel.y += PHYSICS.GRAVITY * dt;
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
    
    // Check Y-axis collision (humanoid only)
    if (this.type === 'humanoid') {
      this.bounds.y = newPos.y;
      const yCollision = checkTileCollision(this.bounds, this.vel, tilemap);
      if (yCollision.collided) {
        this.bounds.y -= yCollision.normal.y * yCollision.penetration;
        this.vel.y = 0;
        
        // Check if landed on ground
        // if (yCollision.normal.y < 0) {
        //   this.grounded = true;
        // }
      } // else {
        // this.grounded = false;
      // }
    } else {
      // Drone - no Y collision, just update position
      this.bounds.y = newPos.y;
    }
    
    // Update position from bounds
    this.pos.x = this.bounds.x;
    this.pos.y = this.bounds.y;
  }
  
  /**
   * Update animation frame
   */
  private updateAnimation(dt: number): void {
    // Animation timing based on state
    const frameTimings: Record<EnemyState, number> = {
      patrol: 110,
      alert: 0,    // Single frame
      shoot: 90,
      hurt: 90,
      dead: 0,     // Single frame
    };
    
    const frameDuration = frameTimings[this.state];
    if (frameDuration === 0) return;
    
    this.animTimer += dt * 1000;
    if (this.animTimer >= frameDuration) {
      this.animTimer = 0;
      this.animFrame++;
      
      // Loop animation (frame counts vary by state)
      const frameCounts: Record<EnemyState, number> = {
        patrol: 6,
        alert: 1,
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
   * Render enemy to canvas
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    
    // Simple rectangle rendering for now
    // TODO: Replace with procedural sprite generation
    
    // Color based on type
    const color = this.type === 'humanoid' ? '#ff4444' : '#ff8800';
    ctx.fillStyle = color;
    
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
    
    // Draw state indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText(
      this.state.substring(0, 1).toUpperCase(),
      this.bounds.x,
      this.bounds.y - 4
    );
  }
  
  /**
   * Take damage
   * @param amount - Damage amount
   */
  takeDamage(amount: number): void {
    if (this.state === 'dead') return;
    
    this.health = Math.max(0, this.health - amount);
    this.hurtTimer = PHYSICS.HURT_DURATION;
    this.state = 'hurt';
    
    if (this.health <= 0) {
      this.state = 'dead';
      this.active = false;
    }
  }
  
  /**
   * Set the callback for when enemy shoots
   * @param callback - Function to call with projectile position and direction
   */
  setShootCallback(callback: (pos: Vec2, direction: Vec2) => void): void {
    this.onShoot = callback;
  }
  
  /**
   * Get current target position (for debugging)
   */
  getTargetPos(): Vec2 | null {
    return this.targetPos;
  }
}

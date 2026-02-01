/**
 * Projectile entity for bullets and energy shots
 * 
 * Projectiles are fired by player or enemies, move in a straight line,
 * and are destroyed on collision with tiles or entities.
 */

import type { Entity } from './entity';
import type { Vec2 } from '../math/vec2';
import type { Rect } from '../math/rect';
import { vec2, add, mul } from '../math/vec2';
import { rect } from '../math/rect';

/**
 * Physics constants for projectiles
 */
const PROJECTILE_SPEED = 200; // px/s
const PROJECTILE_LIFETIME = 2000; // ms
const PROJECTILE_DAMAGE = 1;
const PROJECTILE_WIDTH = 6; // px
const PROJECTILE_HEIGHT = 3; // px

/**
 * Projectile entity
 * 
 * Represents a bullet or energy shot fired by player or enemies.
 * Moves at constant velocity and is destroyed on collision or timeout.
 */
export class Projectile implements Entity {
  pos: Vec2;
  vel: Vec2;
  bounds: Rect;
  active: boolean;
  
  /** Owner of the projectile (player or enemy) */
  owner: 'player' | 'enemy';
  
  /** Damage dealt on hit */
  damage: number;
  
  /** Time projectile has been alive in milliseconds */
  lifetime: number;
  
  /** Maximum lifetime before auto-destruction in milliseconds */
  maxLifetime: number;
  
  /**
   * Create a new projectile
   * @param pos - Starting position
   * @param direction - Direction vector (will be normalized)
   * @param owner - Who fired the projectile
   */
  constructor(pos: Vec2, direction: Vec2, owner: 'player' | 'enemy') {
    this.pos = { ...pos };
    
    // Normalize direction and apply speed
    const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (len === 0) {
      // Default to right if no direction given
      this.vel = vec2(PROJECTILE_SPEED, 0);
    } else {
      this.vel = vec2(
        (direction.x / len) * PROJECTILE_SPEED,
        (direction.y / len) * PROJECTILE_SPEED
      );
    }
    
    // Collision bounds centered on position
    this.bounds = rect(
      pos.x - PROJECTILE_WIDTH / 2,
      pos.y - PROJECTILE_HEIGHT / 2,
      PROJECTILE_WIDTH,
      PROJECTILE_HEIGHT
    );
    
    this.active = true;
    this.owner = owner;
    this.damage = PROJECTILE_DAMAGE;
    this.lifetime = 0;
    this.maxLifetime = PROJECTILE_LIFETIME;
  }
  
  /**
   * Update projectile position and lifetime
   * @param dt - Delta time in seconds
   */
  update(dt: number): void {
    if (!this.active) return;
    
    // Update lifetime (clamped to maxLifetime)
    this.lifetime = Math.min(this.lifetime + dt * 1000, this.maxLifetime);
    
    // Deactivate if lifetime exceeded
    if (this.lifetime >= this.maxLifetime) {
      this.active = false;
      return;
    }
    
    // Update position based on velocity
    this.pos = add(this.pos, mul(this.vel, dt));
    
    // Update collision bounds to match position
    this.bounds.x = this.pos.x - PROJECTILE_WIDTH / 2;
    this.bounds.y = this.pos.y - PROJECTILE_HEIGHT / 2;
  }
  
  /**
   * Render projectile to canvas
   * @param ctx - Canvas rendering context
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    
    // Simple rectangle rendering for now
    // TODO: Replace with procedural sprite generation
    ctx.fillStyle = this.owner === 'player' ? '#00ff00' : '#ff0000';
    ctx.fillRect(
      Math.floor(this.bounds.x),
      Math.floor(this.bounds.y),
      this.bounds.w,
      this.bounds.h
    );
  }
  
  /**
   * Deactivate the projectile (called on collision)
   */
  destroy(): void {
    this.active = false;
  }
}

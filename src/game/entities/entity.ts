/**
 * Entity system for game objects
 * 
 * Defines the base Entity interface that all game objects (player, enemies, projectiles)
 * must implement. Entities have position, velocity, collision bounds, and lifecycle methods.
 */

import type { Vec2 } from '../math/vec2';
import type { Rect } from '../math/rect';

/**
 * Base interface for all game entities
 * 
 * All entities in the game (player, enemies, projectiles) implement this interface.
 * Entities are updated each fixed timestep and rendered each frame.
 */
export interface Entity {
  /** World position of the entity */
  pos: Vec2;
  
  /** Velocity in pixels per second */
  vel: Vec2;
  
  /** Collision bounds relative to position (AABB) */
  bounds: Rect;
  
  /** Whether the entity is active (inactive entities are removed from game) */
  active: boolean;
  
  /**
   * Update entity logic for one fixed timestep
   * @param dt - Delta time in seconds (typically 1/60)
   */
  update(dt: number): void;
  
  /**
   * Render entity to canvas
   * @param ctx - Canvas rendering context
   */
  render(ctx: CanvasRenderingContext2D): void;
}

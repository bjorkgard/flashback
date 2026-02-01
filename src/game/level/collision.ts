/**
 * Collision detection and resolution system.
 * 
 * This module provides AABB (Axis-Aligned Bounding Box) collision detection
 * with axis-by-axis resolution for precise physics simulation. It handles:
 * - Entity vs tilemap collision with one-way platforms
 * - Entity vs entity collision
 * - Ladder overlap detection
 * - Precise ledge grab detection (±2px tolerance)
 * 
 * The collision system uses separate X and Y axis checks to prevent
 * tunneling and ensure accurate collision response.
 * 
 * @module collision
 */

import type { Rect } from "../math/rect";
import type { Vec2 } from "../math/vec2";
import type { Tilemap } from "./tilemap";

/**
 * Result of a collision check.
 * 
 * Contains information about whether a collision occurred,
 * the surface normal for physics response, and penetration depth
 * for position correction.
 */
export interface CollisionResult {
  /** Whether a collision occurred */
  collided: boolean;
  
  /** 
   * Normal vector of the collision surface.
   * Points away from the surface (e.g., {x: 0, y: -1} for floor collision).
   * Used to calculate bounce/slide physics response.
   */
  normal: Vec2;
  
  /** 
   * Penetration depth in pixels.
   * How far the entity has penetrated into the colliding object.
   * Used to push the entity back to a non-colliding position.
   */
  penetration: number;
}

/**
 * Result of a ledge grab check.
 * 
 * Contains information about whether the entity can grab a ledge
 * and the exact position to snap to when grabbing.
 */
export interface LedgeGrabResult {
  /** 
   * Whether the entity can grab the ledge.
   * True only if within ±2px tolerance of a valid ledge edge.
   */
  canGrab: boolean;
  
  /** 
   * Position to snap to when grabbing the ledge.
   * Represents the exact edge position for precise alignment.
   */
  ledgePos: Vec2;
}

/**
 * Checks collision between an entity and the tilemap using axis-by-axis AABB.
 * 
 * This function implements precise collision detection by checking X and Y axes
 * separately. This prevents tunneling through thin walls and ensures accurate
 * collision response. The function:
 * 
 * 1. Checks X-axis collisions first (if moving horizontally)
 * 2. Checks Y-axis collisions second (if moving vertically)
 * 3. Returns immediately on first collision found
 * 4. Handles one-way platforms (only collide from above)
 * 5. Ignores extremely small velocities to avoid floating-point issues
 * 
 * **One-Way Platform Behavior:**
 * - Only collide when entity is moving downward (velocity.y > 0)
 * - Only collide when entity was above the platform (within 5px threshold)
 * - Allows passing through from below and sides
 * 
 * **Validates: Requirements 8.6, 10.3, 12.4**
 * **Property 28: Axis-by-Axis Collision Resolution**
 * 
 * @param entityBounds - The entity's bounding box in world coordinates
 * @param velocity - The entity's velocity vector (used to determine collision direction)
 * @param tilemap - The tilemap to check against
 * @returns Collision result with normal vector and penetration depth
 * 
 * @example
 * ```typescript
 * const bounds = { x: 100, y: 100, w: 16, h: 32 };
 * const velocity = { x: 5, y: 10 };
 * const result = checkTileCollision(bounds, velocity, tilemap);
 * 
 * if (result.collided) {
 *   // Push entity out of collision
 *   bounds.x -= result.normal.x * result.penetration;
 *   bounds.y -= result.normal.y * result.penetration;
 *   
 *   // Stop velocity in collision direction
 *   if (result.normal.x !== 0) velocity.x = 0;
 *   if (result.normal.y !== 0) velocity.y = 0;
 * }
 * ```
 */
export function checkTileCollision(
  entityBounds: Rect,
  velocity: Vec2,
  tilemap: Tilemap
): CollisionResult {
  const tileSize = tilemap.getTileSize();
  let collided = false;
  let normal: Vec2 = { x: 0, y: 0 };
  let penetration = 0;

  // Velocity threshold to avoid floating-point precision issues
  const VELOCITY_EPSILON = 1e-6;

  // Calculate the tile range to check
  const left = Math.floor(entityBounds.x / tileSize);
  const right = Math.floor((entityBounds.x + entityBounds.w) / tileSize);
  const top = Math.floor(entityBounds.y / tileSize);
  const bottom = Math.floor((entityBounds.y + entityBounds.h) / tileSize);

  // Check X-axis collisions (ignore extremely small velocities)
  if (Math.abs(velocity.x) > VELOCITY_EPSILON) {
    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        const tile = tilemap.getTileAt(tx, ty);
        
        if (tile && isSolidTile(tile.type)) {
          const tileRect: Rect = {
            x: tx * tileSize,
            y: ty * tileSize,
            w: tileSize,
            h: tileSize
          };

          if (rectsIntersect(entityBounds, tileRect)) {
            collided = true;
            
            // Calculate penetration and normal
            if (velocity.x > 0) {
              // Moving right, hit left side of tile
              penetration = (entityBounds.x + entityBounds.w) - tileRect.x;
              normal = { x: -1, y: 0 };
            } else {
              // Moving left, hit right side of tile
              penetration = (tileRect.x + tileRect.w) - entityBounds.x;
              normal = { x: 1, y: 0 };
            }
            
            return { collided, normal, penetration };
          }
        }
      }
    }
  }

  // Check Y-axis collisions (ignore extremely small velocities)
  if (Math.abs(velocity.y) > VELOCITY_EPSILON) {
    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        const tile = tilemap.getTileAt(tx, ty);
        
        if (tile && (isSolidTile(tile.type) || tile.type === "oneWay")) {
          const tileRect: Rect = {
            x: tx * tileSize,
            y: ty * tileSize,
            w: tileSize,
            h: tileSize
          };

          // One-way platforms only collide from above
          if (tile.type === "oneWay") {
            const ONE_WAY_THRESHOLD = 5;
            const wasAbove = (entityBounds.y + entityBounds.h - velocity.y) <= tileRect.y + ONE_WAY_THRESHOLD;
            
            if (!wasAbove || velocity.y < 0) {
              continue; // Skip collision
            }
          }

          if (rectsIntersect(entityBounds, tileRect)) {
            collided = true;
            
            // Calculate penetration and normal
            if (velocity.y > 0) {
              // Moving down, hit top side of tile
              penetration = (entityBounds.y + entityBounds.h) - tileRect.y;
              normal = { x: 0, y: -1 };
            } else {
              // Moving up, hit bottom side of tile
              penetration = (tileRect.y + tileRect.h) - entityBounds.y;
              normal = { x: 0, y: 1 };
            }
            
            return { collided, normal, penetration };
          }
        }
      }
    }
  }

  return { collided: false, normal: { x: 0, y: 0 }, penetration: 0 };
}

/**
 * Checks collision between two entity bounding boxes (AABB vs AABB).
 * 
 * This function detects overlap between two rectangular entities and
 * calculates the collision normal based on the axis with smallest overlap.
 * This provides the most natural separation direction for physics response.
 * 
 * The collision normal always points from entity A toward entity B,
 * allowing the caller to apply appropriate physics forces.
 * 
 * **Validates: Requirements 10.3**
 * **Property 21: Projectile Collision Detection**
 * 
 * @param a - First entity's bounding box
 * @param b - Second entity's bounding box
 * @returns Collision result with normal pointing from A to B
 * 
 * @example
 * ```typescript
 * const player = { x: 100, y: 100, w: 16, h: 32 };
 * const enemy = { x: 110, y: 100, w: 16, h: 32 };
 * const result = checkEntityCollision(player, enemy);
 * 
 * if (result.collided) {
 *   console.log('Collision normal:', result.normal);
 *   console.log('Overlap amount:', result.penetration);
 *   // Apply damage, knockback, etc.
 * }
 * ```
 */
export function checkEntityCollision(a: Rect, b: Rect): CollisionResult {
  if (!rectsIntersect(a, b)) {
    return { collided: false, normal: { x: 0, y: 0 }, penetration: 0 };
  }

  // Calculate overlap on each axis
  const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

  // Use the axis with smallest overlap for the normal
  if (overlapX < overlapY) {
    // Collision on X axis
    const normal: Vec2 = a.x < b.x ? { x: -1, y: 0 } : { x: 1, y: 0 };
    return { collided: true, normal, penetration: overlapX };
  } else {
    // Collision on Y axis
    const normal: Vec2 = a.y < b.y ? { x: 0, y: -1 } : { x: 0, y: 1 };
    return { collided: true, normal, penetration: overlapY };
  }
}

/**
 * Checks if an entity overlaps with any ladder tiles.
 * 
 * This function is used to determine if the player can climb.
 * It checks all tiles within the entity's bounding box and returns
 * true if any of them are ladder tiles.
 * 
 * Ladder tiles allow vertical movement and override normal gravity
 * when the player is actively climbing.
 * 
 * @param entityBounds - The entity's bounding box in world coordinates
 * @param tilemap - The tilemap to check against
 * @returns True if the entity is overlapping at least one ladder tile
 * 
 * @example
 * ```typescript
 * const playerBounds = { x: 100, y: 100, w: 16, h: 32 };
 * const onLadder = checkLadderOverlap(playerBounds, tilemap);
 * 
 * if (onLadder && input.isDown('ArrowUp')) {
 *   // Allow climbing
 *   player.state = 'climbing';
 *   player.velocity.y = -CLIMB_SPEED;
 * }
 * ```
 */
export function checkLadderOverlap(
  entityBounds: Rect,
  tilemap: Tilemap
): boolean {
  const tileSize = tilemap.getTileSize();
  
  const left = Math.floor(entityBounds.x / tileSize);
  const right = Math.floor((entityBounds.x + entityBounds.w) / tileSize);
  const top = Math.floor(entityBounds.y / tileSize);
  const bottom = Math.floor((entityBounds.y + entityBounds.h) / tileSize);

  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      const tile = tilemap.getTileAt(tx, ty);
      
      if (tile && tile.type === "ladder") {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if an entity can grab a ledge.
 * 
 * This function implements precise ledge detection with a ±2px tolerance,
 * creating a challenging but fair mechanic. It checks both left and right
 * edges of the entity's bounding box (representing "hands") and looks for:
 * 
 * 1. A solid tile at hand level
 * 2. Empty space above the solid tile (no ceiling blocking)
 * 3. Hand position within 2 pixels of the tile edge
 * 4. Entity not moving upward (velocity.y >= 0)
 * 
 * The tight tolerance makes ledge grabs feel deliberate and skill-based,
 * matching the cinematic platformer aesthetic.
 * 
 * **Validates: Requirements 8.6**
 * **Property 17: Ledge Grab Precision**
 * 
 * @param entityBounds - The entity's bounding box in world coordinates
 * @param velocity - The entity's velocity (must not be moving upward)
 * @param tilemap - The tilemap to check against
 * @returns Ledge grab result with snap position if successful
 * 
 * @example
 * ```typescript
 * const playerBounds = { x: 100, y: 100, w: 16, h: 32 };
 * const velocity = { x: 2, y: 5 }; // Falling
 * const result = checkLedgeGrab(playerBounds, velocity, tilemap);
 * 
 * if (result.canGrab) {
 *   // Snap to ledge position
 *   player.pos = result.ledgePos;
 *   player.state = 'hanging';
 *   player.velocity = { x: 0, y: 0 };
 * }
 * ```
 */
export function checkLedgeGrab(
  entityBounds: Rect,
  velocity: Vec2,
  tilemap: Tilemap
): LedgeGrabResult {
  const LEDGE_GRAB_TOLERANCE = 2;
  const tileSize = tilemap.getTileSize();
  
  // Only check if falling or moving horizontally
  if (velocity.y < 0) {
    return { canGrab: false, ledgePos: { x: 0, y: 0 } };
  }

  // Calculate hand position (top corners of entity)
  const handY = entityBounds.y;
  const leftHandX = entityBounds.x;
  const rightHandX = entityBounds.x + entityBounds.w;

  // Check left side
  const leftTileX = Math.floor(leftHandX / tileSize);
  const leftTileY = Math.floor(handY / tileSize);
  const leftTile = tilemap.getTileAt(leftTileX, leftTileY);
  const aboveLeftTile = tilemap.getTileAt(leftTileX, leftTileY - 1);

  if (leftTile && isSolidTile(leftTile.type) && (!aboveLeftTile || !isSolidTile(aboveLeftTile.type))) {
    const ledgeX = leftTileX * tileSize + tileSize; // Right edge of tile
    const ledgeY = leftTileY * tileSize;
    const distance = Math.abs(leftHandX - ledgeX);

    if (distance <= LEDGE_GRAB_TOLERANCE) {
      return { canGrab: true, ledgePos: { x: ledgeX, y: ledgeY } };
    }
  }

  // Check right side
  const rightTileX = Math.floor(rightHandX / tileSize);
  const rightTileY = Math.floor(handY / tileSize);
  const rightTile = tilemap.getTileAt(rightTileX, rightTileY);
  const aboveRightTile = tilemap.getTileAt(rightTileX, rightTileY - 1);

  if (rightTile && isSolidTile(rightTile.type) && (!aboveRightTile || !isSolidTile(aboveRightTile.type))) {
    const ledgeX = rightTileX * tileSize; // Left edge of tile
    const ledgeY = rightTileY * tileSize;
    const distance = Math.abs(rightHandX - ledgeX);

    if (distance <= LEDGE_GRAB_TOLERANCE) {
      return { canGrab: true, ledgePos: { x: ledgeX, y: ledgeY } };
    }
  }

  return { canGrab: false, ledgePos: { x: 0, y: 0 } };
}

/**
 * Helper function to check if two rectangles intersect.
 * 
 * Uses standard AABB intersection test: rectangles overlap if they
 * overlap on both X and Y axes.
 * 
 * @param a - First rectangle
 * @param b - Second rectangle
 * @returns True if rectangles overlap
 * @internal
 */
function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Helper function to check if a tile type is solid.
 * 
 * Solid tiles block movement and line-of-sight.
 * Other tile types (oneWay, ladder, hazard, etc.) have special behavior
 * and are not considered solid for general collision purposes.
 * 
 * @param type - Tile type string
 * @returns True if tile is solid
 * @internal
 */
function isSolidTile(type: string): boolean {
  return type === "solid";
}

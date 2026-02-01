/**
 * Collision detection and resolution system.
 * Implements AABB collision with axis-by-axis resolution.
 */

import type { Rect } from "../math/rect";
import type { Vec2 } from "../math/vec2";
import type { Tilemap } from "./tilemap";

/**
 * Result of a collision check.
 */
export interface CollisionResult {
  /** Whether a collision occurred */
  collided: boolean;
  
  /** Normal vector of the collision surface */
  normal: Vec2;
  
  /** Penetration depth */
  penetration: number;
}

/**
 * Result of a ledge grab check.
 */
export interface LedgeGrabResult {
  /** Whether the entity can grab the ledge */
  canGrab: boolean;
  
  /** Position to snap to when grabbing */
  ledgePos: Vec2;
}

/**
 * Checks collision between an entity and the tilemap using axis-by-axis AABB.
 * This function resolves collisions by moving the entity along one axis at a time.
 * 
 * @param entityBounds - The entity's bounding box in world coordinates
 * @param velocity - The entity's velocity vector
 * @param tilemap - The tilemap to check against
 * @returns Collision result with adjusted position
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

  // Calculate the tile range to check
  const left = Math.floor(entityBounds.x / tileSize);
  const right = Math.floor((entityBounds.x + entityBounds.w) / tileSize);
  const top = Math.floor(entityBounds.y / tileSize);
  const bottom = Math.floor((entityBounds.y + entityBounds.h) / tileSize);

  // Check X-axis collisions
  if (velocity.x !== 0) {
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

  // Check Y-axis collisions
  if (velocity.y !== 0) {
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
 * @param a - First entity's bounding box
 * @param b - Second entity's bounding box
 * @returns Collision result
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
 * @param entityBounds - The entity's bounding box
 * @param tilemap - The tilemap to check against
 * @returns True if overlapping a ladder
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
 * Requires near-perfect alignment (±2px tolerance) with a platform edge.
 * 
 * @param entityBounds - The entity's bounding box
 * @param velocity - The entity's velocity
 * @param tilemap - The tilemap to check against
 * @returns Ledge grab result
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
 */
function isSolidTile(type: string): boolean {
  return type === "solid";
}

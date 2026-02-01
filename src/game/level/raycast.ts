/**
 * Raycasting system for line-of-sight checks.
 * Uses DDA (Digital Differential Analyzer) algorithm for efficient grid traversal.
 */

import type { Vec2 } from "../math/vec2";
import type { Tile } from "./tileTypes";
import type { Tilemap } from "./tilemap";

/**
 * Result of a raycast operation.
 */
export interface RaycastResult {
  /** Whether the ray hit a solid tile */
  hit: boolean;
  
  /** Position where the ray hit (in world coordinates) */
  hitPos: Vec2;
  
  /** The tile that was hit (null if no hit) */
  hitTile: Tile | null;
}

/**
 * Performs a raycast from start to end position through the tilemap.
 * Uses DDA algorithm to efficiently traverse the tile grid.
 * Returns the first solid tile hit along the ray.
 * 
 * @param start - Starting position in world coordinates
 * @param end - Ending position in world coordinates
 * @param tilemap - The tilemap to raycast through
 * @returns Raycast result with hit information
 */
export function raycastTiles(
  start: Vec2,
  end: Vec2,
  tilemap: Tilemap
): RaycastResult {
  const tileSize = tilemap.getTileSize();
  
  // Convert world coordinates to tile coordinates
  let tileX = Math.floor(start.x / tileSize);
  let tileY = Math.floor(start.y / tileSize);
  
  const endTileX = Math.floor(end.x / tileSize);
  const endTileY = Math.floor(end.y / tileSize);
  
  // Calculate ray direction
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Handle zero-length ray
  if (distance === 0) {
    const tile = tilemap.getTileAt(tileX, tileY);
    if (tile && isSolidTile(tile.type)) {
      return {
        hit: true,
        hitPos: { x: start.x, y: start.y },
        hitTile: tile,
      };
    }
    return {
      hit: false,
      hitPos: { x: start.x, y: start.y },
      hitTile: null,
    };
  }
  
  // Normalize direction
  const dirX = dx / distance;
  const dirY = dy / distance;
  
  // Calculate step direction
  const stepX = dirX > 0 ? 1 : -1;
  const stepY = dirY > 0 ? 1 : -1;
  
  // Calculate distance to next tile boundary
  const nextBoundaryX = (tileX + (stepX > 0 ? 1 : 0)) * tileSize;
  const nextBoundaryY = (tileY + (stepY > 0 ? 1 : 0)) * tileSize;
  
  // Calculate tMax (distance to next tile boundary along ray)
  let tMaxX = dirX !== 0 ? Math.abs((nextBoundaryX - start.x) / dirX) : Infinity;
  let tMaxY = dirY !== 0 ? Math.abs((nextBoundaryY - start.y) / dirY) : Infinity;
  
  // Calculate tDelta (distance to cross one tile along ray)
  const tDeltaX = dirX !== 0 ? Math.abs(tileSize / dirX) : Infinity;
  const tDeltaY = dirY !== 0 ? Math.abs(tileSize / dirY) : Infinity;
  
  // Maximum number of steps to prevent infinite loops
  const maxSteps = Math.abs(endTileX - tileX) + Math.abs(endTileY - tileY) + 2;
  let steps = 0;
  
  // DDA traversal
  while (steps < maxSteps) {
    // Check current tile
    const tile = tilemap.getTileAt(tileX, tileY);
    
    if (tile && isSolidTile(tile.type)) {
      // Hit a solid tile
      const hitX = start.x + dirX * Math.min(tMaxX, tMaxY, distance);
      const hitY = start.y + dirY * Math.min(tMaxX, tMaxY, distance);
      
      return {
        hit: true,
        hitPos: { x: hitX, y: hitY },
        hitTile: tile,
      };
    }
    
    // Check if we've reached the end tile
    if (tileX === endTileX && tileY === endTileY) {
      break;
    }
    
    // Move to next tile
    if (tMaxX < tMaxY) {
      tMaxX += tDeltaX;
      tileX += stepX;
    } else {
      tMaxY += tDeltaY;
      tileY += stepY;
    }
    
    steps++;
  }
  
  // No hit
  return {
    hit: false,
    hitPos: { x: end.x, y: end.y },
    hitTile: null,
  };
}

/**
 * Helper function to check if a tile type is solid (blocks line of sight).
 */
function isSolidTile(type: string): boolean {
  return type === "solid";
}

/**
 * Level data structures and interfaces.
 * Defines the complete structure of a game level.
 */

import type { Tile } from "./tileTypes";
import type { Vec2 } from "../math/vec2";
import type { Rect } from "../math/rect";

/**
 * Enemy type identifier.
 */
export type EnemyType = "humanoid" | "drone";

/**
 * Enemy spawn data in level.
 */
export interface EnemySpawnData {
  /** Type of enemy to spawn */
  type: EnemyType;
  
  /** Spawn position in world coordinates */
  pos: Vec2;
  
  /** Optional patrol waypoints for this enemy */
  patrolWaypoints?: Vec2[];
}

/**
 * Complete level data structure.
 * Contains all information needed to load and run a level.
 */
export interface LevelData {
  /** Width of the level in tiles */
  width: number;
  
  /** Height of the level in tiles */
  height: number;
  
  /** Size of each tile in pixels (typically 16) */
  tileSize: number;
  
  /** Array of all tiles in the level */
  tiles: Tile[];
  
  /** Player spawn position in world coordinates */
  playerSpawn: Vec2;
  
  /** Enemy spawn data */
  enemies: EnemySpawnData[];
  
  /** Level bounds for camera clamping */
  bounds: Rect;
}

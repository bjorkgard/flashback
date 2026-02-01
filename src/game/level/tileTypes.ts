/**
 * Tile types and interfaces for the level system.
 * Defines the structure of tiles in the game world.
 */

/**
 * Enumeration of all tile types in the game.
 */
export type TileType = 
  | "empty"       // No collision, passable
  | "solid"       // Full collision block
  | "oneWay"      // Platform that can be passed through from below
  | "ladder"      // Climbable surface
  | "hazard"      // Damage-dealing tile (electric/acid)
  | "checkpoint"  // Save point
  | "exit";       // Level completion trigger

/**
 * Metadata for special tile types.
 */
export interface TileMetadata {
  /** Type of hazard (for hazard tiles) */
  hazardType?: "electric" | "acid";
  
  /** Unique identifier for checkpoint */
  checkpointId?: string;
  
  /** Destination level for exit tiles */
  exitDestination?: string;
}

/**
 * Represents a single tile in the game world.
 */
export interface Tile {
  /** Type of the tile */
  type: TileType;
  
  /** X coordinate in tile grid */
  x: number;
  
  /** Y coordinate in tile grid */
  y: number;
  
  /** Optional metadata for special tiles */
  metadata?: TileMetadata;
}

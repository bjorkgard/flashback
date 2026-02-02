/**
 * Tilemap class for managing level tile data.
 * Handles level loading, tile access, and animated tiles.
 */

import type { Tile, TileType } from "./tileTypes";
import type { LevelData } from "./levelTypes";

/**
 * Manages the tile grid for a game level.
 * Provides efficient tile lookup and handles animated tiles.
 */
export class Tilemap {
  private _width: number;
  private _height: number;
  private _tileSize: number;
  private tiles: Map<string, Tile>;
  private animatedTiles: Tile[];
  private animationTime: number = 0;
  
  // Public properties for renderer interface compatibility
  public width: number;
  public height: number;
  public tileSize: number;

  /**
   * Creates a new Tilemap from level data.
   * @param levelData - The level data to load
   */
  constructor(levelData: LevelData) {
    this._width = levelData.width;
    this._height = levelData.height;
    this._tileSize = levelData.tileSize;
    
    // Set public properties
    this.width = levelData.width;
    this.height = levelData.height;
    this.tileSize = levelData.tileSize;
    
    this.tiles = new Map();
    this.animatedTiles = [];

    // Build tile map for efficient lookup
    for (const tile of levelData.tiles) {
      // Skip invalid tiles
      if (!this.isValidTileType(tile.type)) {
        console.warn(`Skipping tile with invalid type: ${tile.type}`);
        continue;
      }

      // Skip tiles outside level bounds
      if (tile.x < 0 || tile.x >= this._width || tile.y < 0 || tile.y >= this._height) {
        console.warn(`Skipping tile outside bounds: (${tile.x}, ${tile.y})`);
        continue;
      }

      const key = this.getTileKey(tile.x, tile.y);
      this.tiles.set(key, tile);

      // Track animated tiles
      if (this.isAnimatedTile(tile.type)) {
        this.animatedTiles.push(tile);
      }
    }
  }

  /**
   * Gets the tile at the specified grid coordinates.
   * @param x - X coordinate in tile grid
   * @param y - Y coordinate in tile grid
   * @returns The tile at the specified position, or null if out of bounds or empty
   */
  getTileAt(x: number, y: number): Tile | null {
    // Return null for out-of-bounds access
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
      return null;
    }

    const key = this.getTileKey(x, y);
    return this.tiles.get(key) || null;
  }

  /**
   * Gets the width of the level in tiles.
   */
  getWidth(): number {
    return this._width;
  }

  /**
   * Gets the height of the level in tiles.
   */
  getHeight(): number {
    return this._height;
  }

  /**
   * Gets the tile size in pixels.
   */
  getTileSize(): number {
    return this._tileSize;
  }

  /**
   * Updates animated tiles.
   * @param dt - Delta time in seconds
   */
  update(dt: number): void {
    this.animationTime += dt;
    // Animation logic can be expanded here for hazards, checkpoints, exits
  }

  /**
   * Gets all animated tiles in the level.
   */
  getAnimatedTiles(): Tile[] {
    return this.animatedTiles;
  }

  /**
   * Gets the current animation time.
   */
  getAnimationTime(): number {
    return this.animationTime;
  }

  /**
   * Generates a unique key for tile coordinates.
   */
  private getTileKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * Checks if a tile type is valid.
   */
  private isValidTileType(type: string): type is TileType {
    const validTypes: TileType[] = [
      "empty",
      "solid",
      "oneWay",
      "ladder",
      "hazard",
      "checkpoint",
      "exit"
    ];
    return validTypes.includes(type as TileType);
  }

  /**
   * Checks if a tile type is animated.
   */
  private isAnimatedTile(type: TileType): boolean {
    return type === "hazard" || type === "checkpoint" || type === "exit";
  }
}

/**
 * Loads level data from a JSON object.
 * @param json - The JSON object containing level data
 * @returns Parsed LevelData object
 * @throws Error if JSON is invalid or missing required fields
 */
export function loadLevelFromJSON(json: any): LevelData {
  // Validate required fields
  if (typeof json.width !== "number" || json.width <= 0) {
    throw new Error("Invalid or missing 'width' field in level data");
  }
  if (typeof json.height !== "number" || json.height <= 0) {
    throw new Error("Invalid or missing 'height' field in level data");
  }
  if (typeof json.tileSize !== "number" || json.tileSize <= 0) {
    throw new Error("Invalid or missing 'tileSize' field in level data");
  }
  if (!json.playerSpawn || typeof json.playerSpawn.x !== "number" || typeof json.playerSpawn.y !== "number") {
    throw new Error("Invalid or missing 'playerSpawn' field in level data");
  }

  // Use defaults for optional fields
  const tiles = Array.isArray(json.tiles) ? json.tiles : [];
  const enemies = Array.isArray(json.enemies) ? json.enemies : [];
  
  // Default bounds to full level size if not specified
  const bounds = json.bounds || {
    x: 0,
    y: 0,
    w: json.width * json.tileSize,
    h: json.height * json.tileSize
  };

  return {
    width: json.width,
    height: json.height,
    tileSize: json.tileSize,
    tiles,
    playerSpawn: json.playerSpawn,
    enemies,
    bounds
  };
}

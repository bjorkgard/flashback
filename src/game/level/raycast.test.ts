/**
 * Unit tests for raycasting system.
 */

import { describe, it, expect } from "vitest";
import { raycastTiles } from "./raycast";
import { Tilemap } from "./tilemap";
import type { LevelData } from "./levelTypes";

describe("raycastTiles", () => {
  describe("line-of-sight with clear path", () => {
    it("should not hit when path is clear", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [
          { type: "solid", x: 0, y: 9 },
          { type: "solid", x: 9, y: 9 },
        ],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      // Ray from center to center with no obstacles
      const start = { x: 80, y: 80 };
      const end = { x: 120, y: 80 };

      const result = raycastTiles(start, end, tilemap);

      expect(result.hit).toBe(false);
      expect(result.hitTile).toBeNull();
    });

    it("should not hit when ray passes through empty tiles", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [
          { type: "solid", x: 0, y: 0 },
          { type: "solid", x: 9, y: 9 },
        ],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      // Ray from bottom-left to top-right, avoiding solid tiles
      const start = { x: 24, y: 24 };
      const end = { x: 136, y: 136 };

      const result = raycastTiles(start, end, tilemap);

      expect(result.hit).toBe(false);
      expect(result.hitTile).toBeNull();
    });
  });

  describe("line-of-sight blocked by solid tile", () => {
    it("should hit solid tile in path", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [
          { type: "solid", x: 5, y: 5 },
        ],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      // Ray passes through tile (5, 5)
      const start = { x: 40, y: 40 };
      const end = { x: 120, y: 120 };

      const result = raycastTiles(start, end, tilemap);

      expect(result.hit).toBe(true);
      expect(result.hitTile).not.toBeNull();
      expect(result.hitTile?.type).toBe("solid");
      expect(result.hitTile?.x).toBe(5);
      expect(result.hitTile?.y).toBe(5);
    });

    it("should hit first solid tile when multiple in path", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [
          { type: "solid", x: 3, y: 5 },
          { type: "solid", x: 5, y: 5 },
          { type: "solid", x: 7, y: 5 },
        ],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      // Horizontal ray through multiple tiles
      const start = { x: 24, y: 88 };
      const end = { x: 136, y: 88 };

      const result = raycastTiles(start, end, tilemap);

      expect(result.hit).toBe(true);
      expect(result.hitTile).not.toBeNull();
      // Should hit the first tile (x=3)
      expect(result.hitTile?.x).toBe(3);
    });

    it("should not hit non-solid tiles", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [
          { type: "oneWay", x: 5, y: 5 },
          { type: "ladder", x: 6, y: 5 },
        ],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      // Ray passes through non-solid tiles
      const start = { x: 40, y: 88 };
      const end = { x: 120, y: 88 };

      const result = raycastTiles(start, end, tilemap);

      expect(result.hit).toBe(false);
      expect(result.hitTile).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle ray starting in same tile as end", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      // Same tile
      const start = { x: 80, y: 80 };
      const end = { x: 82, y: 82 };

      const result = raycastTiles(start, end, tilemap);

      expect(result.hit).toBe(false);
    });

    it("should handle ray starting in solid tile", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [
          { type: "solid", x: 5, y: 5 },
        ],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      // Start inside solid tile
      const start = { x: 88, y: 88 };
      const end = { x: 120, y: 120 };

      const result = raycastTiles(start, end, tilemap);

      expect(result.hit).toBe(true);
      expect(result.hitTile?.type).toBe("solid");
    });

    it("should handle adjacent tiles", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [
          { type: "solid", x: 5, y: 5 },
        ],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      // Ray from adjacent tile to another adjacent tile
      const start = { x: 72, y: 88 }; // Tile (4, 5)
      const end = { x: 104, y: 88 }; // Tile (6, 5)

      const result = raycastTiles(start, end, tilemap);

      expect(result.hit).toBe(true);
      expect(result.hitTile?.x).toBe(5);
      expect(result.hitTile?.y).toBe(5);
    });

    it("should handle vertical rays", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [
          { type: "solid", x: 5, y: 5 },
        ],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      // Vertical ray through solid tile
      const start = { x: 88, y: 40 };
      const end = { x: 88, y: 120 };

      const result = raycastTiles(start, end, tilemap);

      expect(result.hit).toBe(true);
      expect(result.hitTile?.x).toBe(5);
      expect(result.hitTile?.y).toBe(5);
    });

    it("should handle horizontal rays", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [
          { type: "solid", x: 5, y: 5 },
        ],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      // Horizontal ray through solid tile
      const start = { x: 40, y: 88 };
      const end = { x: 120, y: 88 };

      const result = raycastTiles(start, end, tilemap);

      expect(result.hit).toBe(true);
      expect(result.hitTile?.x).toBe(5);
      expect(result.hitTile?.y).toBe(5);
    });

    it("should handle zero-length ray", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      // Same start and end
      const start = { x: 80, y: 80 };
      const end = { x: 80, y: 80 };

      const result = raycastTiles(start, end, tilemap);

      expect(result.hit).toBe(false);
    });
  });
});

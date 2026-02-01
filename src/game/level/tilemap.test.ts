/**
 * Unit tests for Tilemap class.
 */

import { describe, it, expect } from "vitest";
import { Tilemap, loadLevelFromJSON } from "./tilemap";
import type { LevelData } from "./levelTypes";

describe("Tilemap", () => {
  describe("constructor and basic access", () => {
    it("should create tilemap from valid level data", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [
          { type: "solid", x: 0, y: 9 },
          { type: "solid", x: 1, y: 9 },
        ],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      expect(tilemap.getWidth()).toBe(10);
      expect(tilemap.getHeight()).toBe(10);
      expect(tilemap.getTileSize()).toBe(16);
    });

    it("should return tile at valid coordinates", () => {
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
      const tile = tilemap.getTileAt(5, 5);

      expect(tile).not.toBeNull();
      expect(tile?.type).toBe("solid");
      expect(tile?.x).toBe(5);
      expect(tile?.y).toBe(5);
    });

    it("should return null for empty tile coordinates", () => {
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
      const tile = tilemap.getTileAt(3, 3);

      expect(tile).toBeNull();
    });
  });

  describe("bounds checking", () => {
    it("should return null for negative coordinates", () => {
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

      expect(tilemap.getTileAt(-1, 5)).toBeNull();
      expect(tilemap.getTileAt(5, -1)).toBeNull();
      expect(tilemap.getTileAt(-1, -1)).toBeNull();
    });

    it("should return null for coordinates beyond level bounds", () => {
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

      expect(tilemap.getTileAt(10, 5)).toBeNull();
      expect(tilemap.getTileAt(5, 10)).toBeNull();
      expect(tilemap.getTileAt(100, 100)).toBeNull();
    });

    it("should skip tiles outside bounds during construction", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [
          { type: "solid", x: 5, y: 5 },
          { type: "solid", x: -1, y: 5 }, // Invalid
          { type: "solid", x: 15, y: 5 }, // Invalid
        ],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      expect(tilemap.getTileAt(5, 5)).not.toBeNull();
      expect(tilemap.getTileAt(-1, 5)).toBeNull();
      expect(tilemap.getTileAt(15, 5)).toBeNull();
    });
  });

  describe("tile type support", () => {
    it("should support all valid tile types", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [
          { type: "empty", x: 0, y: 0 },
          { type: "solid", x: 1, y: 0 },
          { type: "oneWay", x: 2, y: 0 },
          { type: "ladder", x: 3, y: 0 },
          { type: "hazard", x: 4, y: 0, metadata: { hazardType: "electric" } },
          { type: "checkpoint", x: 5, y: 0, metadata: { checkpointId: "cp1" } },
          { type: "exit", x: 6, y: 0, metadata: { exitDestination: "level2" } },
        ],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);

      expect(tilemap.getTileAt(0, 0)?.type).toBe("empty");
      expect(tilemap.getTileAt(1, 0)?.type).toBe("solid");
      expect(tilemap.getTileAt(2, 0)?.type).toBe("oneWay");
      expect(tilemap.getTileAt(3, 0)?.type).toBe("ladder");
      expect(tilemap.getTileAt(4, 0)?.type).toBe("hazard");
      expect(tilemap.getTileAt(5, 0)?.type).toBe("checkpoint");
      expect(tilemap.getTileAt(6, 0)?.type).toBe("exit");
    });

    it("should track animated tiles", () => {
      const levelData: LevelData = {
        width: 10,
        height: 10,
        tileSize: 16,
        tiles: [
          { type: "solid", x: 0, y: 0 },
          { type: "hazard", x: 1, y: 0 },
          { type: "checkpoint", x: 2, y: 0 },
          { type: "exit", x: 3, y: 0 },
        ],
        playerSpawn: { x: 32, y: 128 },
        enemies: [],
        bounds: { x: 0, y: 0, w: 160, h: 160 },
      };

      const tilemap = new Tilemap(levelData);
      const animatedTiles = tilemap.getAnimatedTiles();

      expect(animatedTiles).toHaveLength(3);
      expect(animatedTiles.some(t => t.type === "hazard")).toBe(true);
      expect(animatedTiles.some(t => t.type === "checkpoint")).toBe(true);
      expect(animatedTiles.some(t => t.type === "exit")).toBe(true);
    });
  });

  describe("animation", () => {
    it("should update animation time", () => {
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

      expect(tilemap.getAnimationTime()).toBe(0);

      tilemap.update(0.016);
      expect(tilemap.getAnimationTime()).toBeCloseTo(0.016);

      tilemap.update(0.016);
      expect(tilemap.getAnimationTime()).toBeCloseTo(0.032);
    });
  });
});

describe("loadLevelFromJSON", () => {
  it("should load valid JSON level data", () => {
    const json = {
      width: 20,
      height: 15,
      tileSize: 16,
      playerSpawn: { x: 100, y: 200 },
      tiles: [
        { type: "solid", x: 0, y: 14 },
      ],
      enemies: [
        { type: "humanoid", pos: { x: 150, y: 200 } },
      ],
      bounds: { x: 0, y: 0, w: 320, h: 240 },
    };

    const levelData = loadLevelFromJSON(json);

    expect(levelData.width).toBe(20);
    expect(levelData.height).toBe(15);
    expect(levelData.tileSize).toBe(16);
    expect(levelData.playerSpawn).toEqual({ x: 100, y: 200 });
    expect(levelData.tiles).toHaveLength(1);
    expect(levelData.enemies).toHaveLength(1);
  });

  it("should use default values for optional fields", () => {
    const json = {
      width: 10,
      height: 10,
      tileSize: 16,
      playerSpawn: { x: 50, y: 50 },
    };

    const levelData = loadLevelFromJSON(json);

    expect(levelData.tiles).toEqual([]);
    expect(levelData.enemies).toEqual([]);
    expect(levelData.bounds).toEqual({ x: 0, y: 0, w: 160, h: 160 });
  });

  it("should throw error for missing width", () => {
    const json = {
      height: 10,
      tileSize: 16,
      playerSpawn: { x: 50, y: 50 },
    };

    expect(() => loadLevelFromJSON(json)).toThrow("width");
  });

  it("should throw error for missing height", () => {
    const json = {
      width: 10,
      tileSize: 16,
      playerSpawn: { x: 50, y: 50 },
    };

    expect(() => loadLevelFromJSON(json)).toThrow("height");
  });

  it("should throw error for missing tileSize", () => {
    const json = {
      width: 10,
      height: 10,
      playerSpawn: { x: 50, y: 50 },
    };

    expect(() => loadLevelFromJSON(json)).toThrow("tileSize");
  });

  it("should throw error for missing playerSpawn", () => {
    const json = {
      width: 10,
      height: 10,
      tileSize: 16,
    };

    expect(() => loadLevelFromJSON(json)).toThrow("playerSpawn");
  });

  it("should throw error for invalid width", () => {
    const json = {
      width: 0,
      height: 10,
      tileSize: 16,
      playerSpawn: { x: 50, y: 50 },
    };

    expect(() => loadLevelFromJSON(json)).toThrow("width");
  });
});

/**
 * Unit tests for sample level.
 * 
 * Tests that the sample level loads successfully and contains all required
 * elements for teaching game mechanics progressively.
 */

import { describe, it, expect } from "vitest";
import { Tilemap, loadLevelFromJSON } from "./tilemap";
import sampleLevelData from "./sampleLevel.json";

describe("Sample Level", () => {
  describe("level loading", () => {
    it("should load successfully from JSON", () => {
      expect(() => loadLevelFromJSON(sampleLevelData)).not.toThrow();
      
      const levelData = loadLevelFromJSON(sampleLevelData);
      const tilemap = new Tilemap(levelData);
      
      expect(tilemap.getWidth()).toBe(64);
      expect(tilemap.getHeight()).toBe(24);
      expect(tilemap.getTileSize()).toBe(16);
    });
  });

  describe("required elements", () => {
    it("should have valid player spawn position", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      
      expect(levelData.playerSpawn).toBeDefined();
      expect(levelData.playerSpawn.x).toBeGreaterThanOrEqual(0);
      expect(levelData.playerSpawn.y).toBeGreaterThanOrEqual(0);
      expect(levelData.playerSpawn.x).toBeLessThan(levelData.width * levelData.tileSize);
      expect(levelData.playerSpawn.y).toBeLessThan(levelData.height * levelData.tileSize);
    });

    it("should contain exactly 2 enemies (humanoid and drone)", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      
      expect(levelData.enemies).toHaveLength(2);
      
      const humanoidEnemy = levelData.enemies.find(e => e.type === "humanoid");
      const droneEnemy = levelData.enemies.find(e => e.type === "drone");
      
      expect(humanoidEnemy).toBeDefined();
      expect(droneEnemy).toBeDefined();
    });

    it("should have patrol waypoints for enemies", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      
      levelData.enemies.forEach(enemy => {
        expect(enemy.patrolWaypoints).toBeDefined();
        expect(enemy.patrolWaypoints!.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("should contain at least one hazard tile", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      // const tilemap = new Tilemap(levelData);
      
      const hazardTiles = levelData.tiles.filter(t => t.type === "hazard");
      
      expect(hazardTiles.length).toBeGreaterThanOrEqual(1);
      
      // Verify hazard has metadata
      hazardTiles.forEach(hazard => {
        expect(hazard.metadata).toBeDefined();
        expect(hazard.metadata?.hazardType).toBeDefined();
        expect(["electric", "acid"]).toContain(hazard.metadata?.hazardType);
      });
    });

    it("should contain exactly one checkpoint", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      
      const checkpoints = levelData.tiles.filter(t => t.type === "checkpoint");
      
      expect(checkpoints).toHaveLength(1);
      
      // Verify checkpoint has metadata
      const checkpoint = checkpoints[0];
      expect(checkpoint.metadata).toBeDefined();
      expect(checkpoint.metadata?.checkpointId).toBeDefined();
    });

    it("should contain exactly one exit", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      
      const exits = levelData.tiles.filter(t => t.type === "exit");
      
      expect(exits).toHaveLength(1);
      
      // Verify exit has metadata
      const exit = exits[0];
      expect(exit.metadata).toBeDefined();
      expect(exit.metadata?.exitDestination).toBeDefined();
    });
  });

  describe("level sections", () => {
    it("should have solid ground tiles for walking section", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      
      // Section 1: Walking and jumping (x: 0-15)
      const groundTiles = levelData.tiles.filter(
        t => t.type === "solid" && t.x >= 0 && t.x <= 15 && t.y === 23
      );
      
      expect(groundTiles.length).toBeGreaterThanOrEqual(10);
    });

    it("should have ladder tiles for climbing section", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      
      // Section 2: Ladder climbing (x: 16-25)
      const ladderTiles = levelData.tiles.filter(
        t => t.type === "ladder" && t.x >= 16 && t.x <= 25
      );
      
      expect(ladderTiles.length).toBeGreaterThanOrEqual(6);
    });

    it("should have gap for deliberate jump challenge", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      
      // Section 3: Gap jump (x: 26-35)
      // Check for platforms with gap between them
      const leftPlatform = levelData.tiles.filter(
        t => t.type === "solid" && t.x >= 26 && t.x <= 28 && t.y === 23
      );
      const rightPlatform = levelData.tiles.filter(
        t => t.type === "solid" && t.x >= 33 && t.x <= 35 && t.y === 23
      );
      
      expect(leftPlatform.length).toBeGreaterThanOrEqual(2);
      expect(rightPlatform.length).toBeGreaterThanOrEqual(2);
      
      // Verify there's a gap (no solid tiles between x: 29-32)
      const gapTiles = levelData.tiles.filter(
        t => t.type === "solid" && t.x >= 29 && t.x <= 32 && t.y === 23
      );
      expect(gapTiles.length).toBe(0);
    });

    it("should have platforms at different heights for ledge grab", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      
      // Section 4: Ledge grab challenge (x: 36-45)
      const platforms = levelData.tiles.filter(
        t => t.type === "solid" && t.x >= 36 && t.x <= 45
      );
      
      expect(platforms.length).toBeGreaterThanOrEqual(4);
      
      // Check for platforms at different heights
      const uniqueHeights = new Set(platforms.map(p => p.y));
      expect(uniqueHeights.size).toBeGreaterThanOrEqual(2);
    });

    it("should have checkpoint before final challenge", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      
      const checkpoint = levelData.tiles.find(t => t.type === "checkpoint");
      const exit = levelData.tiles.find(t => t.type === "exit");
      
      expect(checkpoint).toBeDefined();
      expect(exit).toBeDefined();
      
      // Checkpoint should be before exit
      expect(checkpoint!.x).toBeLessThan(exit!.x);
    });
  });

  describe("level bounds", () => {
    it("should have valid bounds matching level dimensions", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      
      expect(levelData.bounds).toBeDefined();
      expect(levelData.bounds.x).toBe(0);
      expect(levelData.bounds.y).toBe(0);
      expect(levelData.bounds.w).toBe(levelData.width * levelData.tileSize);
      expect(levelData.bounds.h).toBe(levelData.height * levelData.tileSize);
    });

    it("should have all tiles within bounds", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      
      levelData.tiles.forEach(tile => {
        expect(tile.x).toBeGreaterThanOrEqual(0);
        expect(tile.y).toBeGreaterThanOrEqual(0);
        expect(tile.x).toBeLessThan(levelData.width);
        expect(tile.y).toBeLessThan(levelData.height);
      });
    });

    it("should have all enemies within bounds", () => {
      const levelData = loadLevelFromJSON(sampleLevelData);
      
      levelData.enemies.forEach(enemy => {
        expect(enemy.pos.x).toBeGreaterThanOrEqual(0);
        expect(enemy.pos.y).toBeGreaterThanOrEqual(0);
        expect(enemy.pos.x).toBeLessThan(levelData.bounds.w);
        expect(enemy.pos.y).toBeLessThan(levelData.bounds.h);
        
        // Check waypoints if present
        if (enemy.patrolWaypoints) {
          enemy.patrolWaypoints.forEach(waypoint => {
            expect(waypoint.x).toBeGreaterThanOrEqual(0);
            expect(waypoint.y).toBeGreaterThanOrEqual(0);
            expect(waypoint.x).toBeLessThan(levelData.bounds.w);
            expect(waypoint.y).toBeLessThan(levelData.bounds.h);
          });
        }
      });
    });
  });
});

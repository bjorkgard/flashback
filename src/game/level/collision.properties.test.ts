/**
 * Property-based tests for collision system.
 * Tests universal correctness properties across randomized inputs.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  checkTileCollision,
  checkEntityCollision,
  checkLedgeGrab,
} from "./collision";
import { Tilemap } from "./tilemap";
import type { LevelData } from "./levelTypes";
import type { Rect } from "../math/rect";
import type { Vec2 } from "../math/vec2";

describe("Collision Properties", () => {
  /**
   * Property 17: Ledge Grab Precision
   * For any ledge grab attempt, the player's hand position should be within ±2 pixels
   * of the platform edge for the grab to succeed; attempts outside this tolerance should fail.
   * The hand must also be inside or at the boundary of the ledge tile for detection.
   * Validates: Requirements 8.6
   */
  it("Property 17: Ledge Grab Precision", () => {
    fc.assert(
      fc.property(
        fc.record({
          entityX: fc.float({ min: 10, max: 200, noNaN: true }),
          entityY: fc.float({ min: 10, max: 200, noNaN: true }),
          entityW: fc.float({ min: 10, max: 30, noNaN: true }),
          entityH: fc.float({ min: 20, max: 50, noNaN: true }),
          ledgeTileX: fc.integer({ min: 1, max: 10 }),
          ledgeTileY: fc.integer({ min: 1, max: 10 }),
          velocityY: fc.float({ min: 0, max: 100, noNaN: true }),
        }),
        ({ entityX, entityY, entityW, entityH, ledgeTileX, ledgeTileY, velocityY }) => {
          const LEDGE_GRAB_TOLERANCE = 2;
          const tileSize = 16;

          // Create a simple level with a ledge
          const levelData: LevelData = {
            width: 20,
            height: 20,
            tileSize,
            tiles: [
              { type: "solid", x: ledgeTileX, y: ledgeTileY },
            ],
            playerSpawn: { x: 0, y: 0 },
            enemies: [],
            bounds: { x: 0, y: 0, w: 320, h: 320 },
          };

          const tilemap = new Tilemap(levelData);

          const entityBounds: Rect = {
            x: entityX,
            y: entityY,
            w: entityW,
            h: entityH,
          };

          const velocity: Vec2 = { x: 0, y: velocityY };

          const result = checkLedgeGrab(entityBounds, velocity, tilemap);

          // Calculate actual distances to ledge edges
          const leftHandX = entityBounds.x;
          const rightHandX = entityBounds.x + entityBounds.w;
          const handY = entityBounds.y;

          const ledgeLeftEdge = ledgeTileX * tileSize;
          const ledgeRightEdge = (ledgeTileX + 1) * tileSize;
          // const ledgeTopY = ledgeTileY * tileSize;

          // Check if either hand is inside the ledge tile
          const leftHandTileX = Math.floor(leftHandX / tileSize);
          const rightHandTileX = Math.floor(rightHandX / tileSize);
          const handTileY = Math.floor(handY / tileSize);
          
          const leftHandInLedgeTile = leftHandTileX === ledgeTileX && handTileY === ledgeTileY;
          const rightHandInLedgeTile = rightHandTileX === ledgeTileX && handTileY === ledgeTileY;
          const handInLedgeTile = leftHandInLedgeTile || rightHandInLedgeTile;

          // Calculate distance to nearest edge
          const distanceToLeftEdge = Math.abs(leftHandX - ledgeRightEdge);
          const distanceToRightEdge = Math.abs(rightHandX - ledgeLeftEdge);
          const minDistance = Math.min(distanceToLeftEdge, distanceToRightEdge);

          // Check if there's empty space above the ledge
          const aboveTile = tilemap.getTileAt(ledgeTileX, ledgeTileY - 1);
          const hasEmptyAbove = !aboveTile || aboveTile.type !== "solid";

          if (handInLedgeTile && hasEmptyAbove && minDistance <= LEDGE_GRAB_TOLERANCE) {
            // Should be able to grab: hand is in ledge tile, within tolerance, and space above
            expect(result.canGrab).toBe(true);
          } else if (!handInLedgeTile || minDistance > LEDGE_GRAB_TOLERANCE || !hasEmptyAbove) {
            // Should not be able to grab if hand not in tile, too far, or no space above
            expect(result.canGrab).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 21: Projectile Collision Detection
   * For any projectile whose AABB intersects with a tile or enemy AABB,
   * the collision system should detect the intersection.
   * Validates: Requirements 10.3
   */
  it("Property 21: Projectile Collision Detection", () => {
    fc.assert(
      fc.property(
        fc.record({
          projX: fc.float({ min: 0, max: 300, noNaN: true }),
          projY: fc.float({ min: 0, max: 300, noNaN: true }),
          projW: fc.constant(6), // Projectile width
          projH: fc.constant(3), // Projectile height
          targetX: fc.float({ min: 0, max: 300, noNaN: true }),
          targetY: fc.float({ min: 0, max: 300, noNaN: true }),
          targetW: fc.float({ min: 10, max: 40, noNaN: true }),
          targetH: fc.float({ min: 10, max: 40, noNaN: true }),
        }),
        ({ projX, projY, projW, projH, targetX, targetY, targetW, targetH }) => {
          const projectile: Rect = { x: projX, y: projY, w: projW, h: projH };
          const target: Rect = { x: targetX, y: targetY, w: targetW, h: targetH };

          const result = checkEntityCollision(projectile, target);

          // Calculate if rectangles actually intersect
          const intersects =
            projX < targetX + targetW &&
            projX + projW > targetX &&
            projY < targetY + targetH &&
            projY + projH > targetY;

          if (intersects) {
            expect(result.collided).toBe(true);
          } else {
            expect(result.collided).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 28: Axis-by-Axis Collision Resolution
   * For any entity-tilemap collision, resolving X-axis collisions before Y-axis collisions
   * should produce correct sliding behavior along walls and prevent tunneling through tiles.
   * Validates: Requirements 12.4
   */
  it("Property 28: Axis-by-Axis Collision Resolution", () => {
    fc.assert(
      fc.property(
        fc.record({
          entityX: fc.float({ min: 20, max: 100, noNaN: true }),
          entityY: fc.float({ min: 20, max: 100, noNaN: true }),
          entityW: fc.constant(24),
          entityH: fc.constant(40),
          velocityX: fc.float({ min: -50, max: 50, noNaN: true }),
          velocityY: fc.float({ min: -50, max: 50, noNaN: true }),
          wallTileX: fc.integer({ min: 5, max: 10 }),
          wallTileY: fc.integer({ min: 5, max: 10 }),
        }),
        ({ entityX, entityY, entityW, entityH, velocityX, velocityY, wallTileX, wallTileY }) => {
          const tileSize = 16;

          // Create a level with a wall tile
          const levelData: LevelData = {
            width: 20,
            height: 20,
            tileSize,
            tiles: [
              { type: "solid", x: wallTileX, y: wallTileY },
            ],
            playerSpawn: { x: 0, y: 0 },
            enemies: [],
            bounds: { x: 0, y: 0, w: 320, h: 320 },
          };

          const tilemap = new Tilemap(levelData);

          // Check X-axis collision first
          const entityBoundsX: Rect = {
            x: entityX + velocityX,
            y: entityY,
            w: entityW,
            h: entityH,
          };

          const xCollision = checkTileCollision(
            entityBoundsX,
            { x: velocityX, y: 0 },
            tilemap
          );

          // Check Y-axis collision
          const entityBoundsY: Rect = {
            x: entityX,
            y: entityY + velocityY,
            w: entityW,
            h: entityH,
          };

          const yCollision = checkTileCollision(
            entityBoundsY,
            { x: 0, y: velocityY },
            tilemap
          );

          // If X collision detected, normal should be horizontal
          if (xCollision.collided) {
            expect(Math.abs(xCollision.normal.x)).toBe(1);
            expect(xCollision.normal.y).toBe(0);
          }

          // If Y collision detected, normal should be vertical
          if (yCollision.collided) {
            expect(yCollision.normal.x).toBe(0);
            expect(Math.abs(yCollision.normal.y)).toBe(1);
          }

          // Penetration should always be non-negative
          if (xCollision.collided) {
            expect(xCollision.penetration).toBeGreaterThanOrEqual(0);
          }
          if (yCollision.collided) {
            expect(yCollision.penetration).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

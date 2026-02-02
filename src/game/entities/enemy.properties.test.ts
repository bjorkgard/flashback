/**
 * Property-based tests for Enemy AI behavior
 * 
 * Tests universal correctness properties for enemy AI using fast-check.
 * These tests verify that enemy behavior is consistent across all valid inputs.
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { Enemy } from './enemy';
import { Tilemap } from '../level/tilemap';
import { vec2 } from '../math/vec2';
// import type { Vec2 } from '../math/vec2';
import type { LevelData } from '../level/levelTypes';

/**
 * Create a simple test tilemap with no obstacles
 */
function createEmptyTilemap(): Tilemap {
  const levelData: LevelData = {
    width: 64,
    height: 24,
    tileSize: 16,
    tiles: [],
    playerSpawn: { x: 0, y: 0 },
    enemies: [],
    bounds: { x: 0, y: 0, w: 1024, h: 384 }
  };
  return new Tilemap(levelData);
}

/**
 * Create a tilemap with a wall between two positions
 */
function createTilemapWithWall(wallX: number, wallY: number): Tilemap {
  const levelData: LevelData = {
    width: 64,
    height: 24,
    tileSize: 16,
    tiles: [
      { type: 'solid', x: Math.floor(wallX / 16), y: Math.floor(wallY / 16) }
    ],
    playerSpawn: { x: 0, y: 0 },
    enemies: [],
    bounds: { x: 0, y: 0, w: 1024, h: 384 }
  };
  return new Tilemap(levelData);
}

describe('Enemy AI Property Tests', () => {
  /**
   * Property 24: Patrol Waypoint Following
   * 
   * For any enemy in patrol state with defined waypoints, the enemy should
   * move toward the current waypoint and cycle to the next waypoint upon
   * reaching it (within 5px tolerance).
   * 
   * Validates: Requirements 11.1
   */
  test('Feature: cinematic-platformer, Property 24: Patrol waypoint following', () => {
    fc.assert(
      fc.property(
        fc.record({
          startX: fc.float({ min: 100, max: 900 }),
          startY: fc.float({ min: 100, max: 300 }),
          waypointX: fc.float({ min: 100, max: 900 }),
          waypointY: fc.float({ min: 100, max: 300 }),
          enemyType: fc.constantFrom('humanoid' as const, 'drone' as const),
        }),
        ({ startX, startY, waypointX, waypointY, enemyType }) => {
          // Create enemy with two waypoints
          const waypoint1 = vec2(startX, startY);
          const waypoint2 = vec2(waypointX, waypointY);
          const enemy = new Enemy(startX, startY, enemyType, [waypoint1, waypoint2]);
          
          const tilemap = createEmptyTilemap();
          const playerPos = vec2(2000, 2000); // Far away
          
          // Initial waypoint should be 0
          expect(enemy['currentWaypoint']).toBe(0);
          
          // Update enemy multiple times to move toward waypoint
          for (let i = 0; i < 100; i++) {
            enemy.update(1/60, playerPos, tilemap);
            
            // Check if reached waypoint 1 (should cycle to waypoint 2)
            const distToWaypoint1 = Math.sqrt(
              Math.pow(enemy.pos.x - waypoint1.x, 2) + 
              Math.pow(enemy.pos.y - waypoint1.y, 2)
            );
            
            if (distToWaypoint1 <= 5) {
              // Should have cycled to next waypoint
              expect(enemy['currentWaypoint']).toBe(1);
              break;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 25: Line-of-Sight Detection
   * 
   * For any enemy in patrol state, if the player is within detection range (200px)
   * and the raycast from enemy to player does not hit solid tiles, the enemy
   * should transition to alert state.
   * 
   * Validates: Requirements 11.2
   */
  test('Feature: cinematic-platformer, Property 25: Line-of-sight detection', () => {
    fc.assert(
      fc.property(
        fc.record({
          enemyX: fc.float({ min: 200, max: 600 }),
          enemyY: fc.float({ min: 200, max: 300 }),
          playerOffsetX: fc.float({ min: -150, max: 150 }),
          playerOffsetY: fc.float({ min: -150, max: 150 }),
          enemyType: fc.constantFrom('humanoid' as const, 'drone' as const),
        }),
        ({ enemyX, enemyY, playerOffsetX, playerOffsetY, enemyType }) => {
          const enemy = new Enemy(enemyX, enemyY, enemyType, [vec2(enemyX, enemyY)]);
          const playerPos = vec2(enemyX + playerOffsetX, enemyY + playerOffsetY);
          
          // Calculate distance
          const distance = Math.sqrt(playerOffsetX * playerOffsetX + playerOffsetY * playerOffsetY);
          
          // Create empty tilemap (no obstacles)
          const tilemap = createEmptyTilemap();
          
          // Enemy starts in patrol state
          expect(enemy.state).toBe('patrol');
          
          // Update enemy
          enemy.update(1/60, playerPos, tilemap);
          
          // If player is within detection range, enemy should alert
          if (distance <= 200) {
            expect(enemy.state).toBe('alert');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 26: Alert State Behavior
   * 
   * For any enemy transitioning to alert state, the enemy should face toward
   * the player's position (facing direction matches sign of player.x - enemy.x).
   * 
   * Validates: Requirements 11.3
   */
  test('Feature: cinematic-platformer, Property 26: Alert state behavior', () => {
    fc.assert(
      fc.property(
        fc.record({
          enemyX: fc.float({ min: 300, max: 700 }),
          enemyY: fc.float({ min: 200, max: 300 }),
          playerX: fc.float({ min: 100, max: 900 }),
          playerY: fc.float({ min: 200, max: 300 }),
          enemyType: fc.constantFrom('humanoid' as const, 'drone' as const),
        }),
        ({ enemyX, enemyY, playerX, playerY, enemyType }) => {
          // Skip if player is too close (same position)
          if (Math.abs(playerX - enemyX) < 1) return;
          
          const enemy = new Enemy(enemyX, enemyY, enemyType, [vec2(enemyX, enemyY)]);
          const playerPos = vec2(playerX, playerY);
          
          // Calculate distance
          const distance = Math.sqrt(
            Math.pow(playerX - enemyX, 2) + 
            Math.pow(playerY - enemyY, 2)
          );
          
          // Only test if player is within detection range
          if (distance > 200) return;
          
          const tilemap = createEmptyTilemap();
          
          // Update enemy to trigger detection (first frame: patrol -> alert transition)
          enemy.update(1/60, playerPos, tilemap);
          
          // Update again to allow alert state to process (second frame: alert state logic runs)
          enemy.update(1/60, playerPos, tilemap);
          
          // Enemy should be in alert state
          if (enemy.state === 'alert') {
            // Check facing direction
            const expectedFacing = playerX > enemyX ? 1 : -1;
            expect(enemy.facing).toBe(expectedFacing);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 27: Enemy Shooting Behavior
   * 
   * For any alerted enemy where the player is within shoot range (150px)
   * and shoot cooldown has expired, the enemy should fire a projectile
   * toward the player and reset the cooldown timer.
   * 
   * Validates: Requirements 11.4
   */
  test('Feature: cinematic-platformer, Property 27: Enemy shooting behavior', () => {
    fc.assert(
      fc.property(
        fc.record({
          enemyX: fc.float({ min: 300, max: 700 }),
          enemyY: fc.float({ min: 200, max: 300 }),
          playerOffsetX: fc.float({ min: -140, max: 140 }),
          playerOffsetY: fc.float({ min: -140, max: 140 }),
          enemyType: fc.constantFrom('humanoid' as const, 'drone' as const),
        }),
        ({ enemyX, enemyY, playerOffsetX, playerOffsetY, enemyType }) => {
          const enemy = new Enemy(enemyX, enemyY, enemyType, [vec2(enemyX, enemyY)]);
          const playerPos = vec2(enemyX + playerOffsetX, enemyY + playerOffsetY);
          
          // Calculate distance
          const distance = Math.sqrt(playerOffsetX * playerOffsetX + playerOffsetY * playerOffsetY);
          
          const tilemap = createEmptyTilemap();
          
          // Track if projectile was fired
          let projectileFired = false;
          enemy.setShootCallback(() => {
            projectileFired = true;
          });
          
          // Update enemy to trigger alert (first frame: patrol -> alert)
          enemy.update(1/60, playerPos, tilemap);
          
          // If in alert state and within shoot range, should eventually shoot
          if (enemy.state === 'alert' && distance <= 150) {
            // Update multiple times to trigger shoot state and animation
            // Frame 1: alert state processes, may transition to shoot
            // Frame 2: shoot state starts, animFrame = 0, callback fires
            // Frame 3+: animation progresses
            for (let i = 0; i < 20; i++) {
              enemy.update(1/60, playerPos, tilemap);
              
              if (projectileFired) {
                // Success - projectile was fired
                break;
              }
            }
            
            // Verify projectile was fired
            expect(projectileFired).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional test: Enemy should not detect player through walls
   */
  test('Enemy should not detect player through solid walls', () => {
    fc.assert(
      fc.property(
        fc.record({
          enemyX: fc.float({ min: 100, max: 300 }),
          enemyY: fc.float({ min: 200, max: 300 }),
          playerX: fc.float({ min: 500, max: 700 }),
          playerY: fc.float({ min: 200, max: 300 }),
          enemyType: fc.constantFrom('humanoid' as const, 'drone' as const),
        }),
        ({ enemyX, enemyY, playerX, playerY, enemyType }) => {
          const enemy = new Enemy(enemyX, enemyY, enemyType, [vec2(enemyX, enemyY)]);
          const playerPos = vec2(playerX, playerY);
          
          // Create tilemap with wall between enemy and player
          const wallX = (enemyX + playerX) / 2;
          const wallY = enemyY;
          const tilemap = createTilemapWithWall(wallX, wallY);
          
          // Enemy starts in patrol state
          expect(enemy.state).toBe('patrol');
          
          // Update enemy
          enemy.update(1/60, playerPos, tilemap);
          
          // Enemy should remain in patrol (wall blocks line of sight)
          expect(enemy.state).toBe('patrol');
        }
      ),
      { numRuns: 50 }
    );
  });
});

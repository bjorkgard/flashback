/**
 * Property-based tests for sprite generation
 * Tests universal correctness properties across randomized inputs
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateAllAnimations,
  clearSpriteCache,
} from './sprites';

describe('Sprite Generation Properties', () => {
  /**
   * Property 2: Sprite Generation Determinism
   * For any seed value, calling the Sprite_Generator multiple times with the same seed
   * should produce pixel-identical sprite data for all animation frames.
   * Validates: Requirements 2.3
   */
  test('Property 2: Sprite generation determinism', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (seed) => {
          // Clear cache to ensure fresh generation
          clearSpriteCache();

          // Generate twice with same seed
          const animSet1 = generateAllAnimations(seed);
          clearSpriteCache();
          const animSet2 = generateAllAnimations(seed);

          // Should have same animation names
          const animNames1 = Object.keys(animSet1).sort();
          const animNames2 = Object.keys(animSet2).sort();
          expect(animNames1).toEqual(animNames2);

          // Compare pixel data for all animations
          for (const animName of animNames1) {
            const frames1 = animSet1[animName];
            const frames2 = animSet2[animName];

            expect(frames1.length).toBe(frames2.length);

            for (let i = 0; i < frames1.length; i++) {
              const frame1 = frames1[i];
              const frame2 = frames2[i];

              // Check dimensions match
              expect(frame1.width).toBe(frame2.width);
              expect(frame1.height).toBe(frame2.height);

              // Check pixel data is identical
              const data1 = Array.from(frame1.imageData.data);
              const data2 = Array.from(frame2.imageData.data);
              expect(data1).toEqual(data2);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Correct Sprite Dimensions
   * For any generated sprite, the dimensions should match the entity type:
   * - Player sprites: 24×40px
   * - Humanoid enemy sprites: 22×38px
   * - Drone enemy sprites: 26×18px
   * - Projectile sprites: 6×3px
   * - Muzzle flash: 10×10px
   * - Tile sprites: 16×16px
   * Validates: Requirements 4.3, 4.4, 4.5, 4.6, 7.1
   */
  test('Property 9: Correct sprite dimensions', () => {
    const testCases = [
      { seed: 'PLAYER_TEST', expectedWidth: 24, expectedHeight: 40 },
      { seed: 'ENEMY_HUMANOID_TEST', expectedWidth: 22, expectedHeight: 38 },
      { seed: 'ENEMY_DRONE_TEST', expectedWidth: 26, expectedHeight: 18 },
      { seed: 'PROJECTILE_TEST', expectedWidth: 6, expectedHeight: 3 },
      { seed: 'MUZZLE_TEST', expectedWidth: 10, expectedHeight: 10 },
      { seed: 'TILE_TEST', expectedWidth: 16, expectedHeight: 16 },
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...testCases),
        fc.nat(100), // Random suffix
        (testCase, suffix) => {
          clearSpriteCache();
          const seed = `${testCase.seed}_${suffix}`;
          const animSet = generateAllAnimations(seed);

          // Check all frames in all animations have correct dimensions
          for (const animName in animSet) {
            const frames = animSet[animName];
            for (const frame of frames) {
              expect(frame.width).toBe(testCase.expectedWidth);
              expect(frame.height).toBe(testCase.expectedHeight);
              expect(frame.imageData.width).toBe(testCase.expectedWidth);
              expect(frame.imageData.height).toBe(testCase.expectedHeight);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Complete Animation Frame Sets
   * For any entity type, the generated animation set should contain the correct
   * number of frames for each animation.
   * Validates: Requirements 5.1-5.12, 6.1-6.5
   */
  test('Property 10: Complete animation frame sets', () => {
    const playerAnimations = {
      idle: 4,
      walk: 6,
      run: 6,
      jump: 2,
      fall: 2,
      landRecover: 2,
      roll: 8,
      hang: 2,
      climbUp: 4,
      shoot: 3,
      hurt: 2,
      dead: 1,
    };

    const enemyHumanoidAnimations = {
      patrol: 6,
      alert: 1,
      shoot: 3,
      hurt: 2,
      dead: 1,
    };

    const enemyDroneAnimations = {
      patrol: 4,
      alert: 1,
      shoot: 2,
      hurt: 1,
      dead: 1,
    };

    fc.assert(
      fc.property(
        fc.nat(1000),
        (suffix) => {
          clearSpriteCache();

          // Test player animations
          const playerSeed = `PLAYER_${suffix}`;
          const playerAnimSet = generateAllAnimations(playerSeed);
          for (const [animName, expectedFrames] of Object.entries(playerAnimations)) {
            expect(playerAnimSet[animName]).toBeDefined();
            expect(playerAnimSet[animName].length).toBe(expectedFrames);
          }

          // Test humanoid enemy animations
          const humanoidSeed = `ENEMY_HUMANOID_${suffix}`;
          const humanoidAnimSet = generateAllAnimations(humanoidSeed);
          for (const [animName, expectedFrames] of Object.entries(enemyHumanoidAnimations)) {
            expect(humanoidAnimSet[animName]).toBeDefined();
            expect(humanoidAnimSet[animName].length).toBe(expectedFrames);
          }

          // Test drone enemy animations
          const droneSeed = `ENEMY_DRONE_${suffix}`;
          const droneAnimSet = generateAllAnimations(droneSeed);
          for (const [animName, expectedFrames] of Object.entries(enemyDroneAnimations)) {
            expect(droneAnimSet[animName]).toBeDefined();
            expect(droneAnimSet[animName].length).toBe(expectedFrames);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Non-Placeholder Sprites
   * For any generated sprite, the pixel data should be non-uniform (not all the same color)
   * and contain at least 10% non-transparent pixels, ensuring no placeholder rectangles
   * or incomplete graphics.
   * Validates: Requirements 16.2, 16.4
   */
  test('Property 11: Non-placeholder sprites', () => {
    const entityTypes = [
      'PLAYER',
      'ENEMY_HUMANOID',
      'ENEMY_DRONE',
      'PROJECTILE',
      'MUZZLE',
      'TILE',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...entityTypes),
        fc.nat(1000),
        (entityType, suffix) => {
          clearSpriteCache();
          const seed = `${entityType}_${suffix}`;
          const animSet = generateAllAnimations(seed);

          // Check all frames in all animations
          for (const animName in animSet) {
            const frames = animSet[animName];
            for (const frame of frames) {
              const data = frame.imageData.data;
              const totalPixels = frame.width * frame.height;
              
              // Count non-transparent pixels
              let nonTransparentCount = 0;
              const colors = new Set<string>();

              for (let i = 0; i < data.length; i += 4) {
                const alpha = data[i + 3];
                if (alpha > 0) {
                  nonTransparentCount++;
                  // Track unique colors (RGBA)
                  const color = `${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`;
                  colors.add(color);
                }
              }

              // At least 10% non-transparent pixels
              const nonTransparentPercent = nonTransparentCount / totalPixels;
              expect(nonTransparentPercent).toBeGreaterThanOrEqual(0.1);

              // Not all the same color (at least 2 unique colors)
              expect(colors.size).toBeGreaterThanOrEqual(2);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

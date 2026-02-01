/**
 * Property-based tests for Camera system
 * 
 * Tests:
 * - Property 29: Smooth Camera Follow
 * - Property 30: Camera Bounds Clamping
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { Camera } from './camera';
import { vec2 } from '../math/vec2';
import { rect } from '../math/rect';

describe('Camera Property-Based Tests', () => {
  /**
   * Property 29: Smooth Camera Follow
   * 
   * For any camera update with a target, the camera position should interpolate
   * toward the target position using lerp with follow speed factor (0.1),
   * producing smooth movement without instant snapping.
   * 
   * Validates: Requirements 12.5
   */
  test('Feature: cinematic-platformer, Property 29: Smooth Camera Follow', () => {
    fc.assert(
      fc.property(
        fc.record({
          targetX: fc.float({ min: 0, max: 2000, noNaN: true }),
          targetY: fc.float({ min: 0, max: 2000, noNaN: true }),
          initialCameraX: fc.float({ min: 0, max: 2000, noNaN: true }),
          initialCameraY: fc.float({ min: 0, max: 2000, noNaN: true }),
        }),
        ({ targetX, targetY, initialCameraX, initialCameraY }) => {
          const camera = new Camera(384, 216);
          camera.x = initialCameraX;
          camera.y = initialCameraY;
          camera.setTarget(vec2(targetX, targetY));

          const initialX = camera.x;
          const initialY = camera.y;

          // Update camera
          camera.update(1 / 60);

          // Calculate expected position (lerp with followSpeed = 0.1)
          const desiredX = targetX - camera.width / 2;
          const desiredY = targetY - camera.height / 2;
          const expectedX = initialX + (desiredX - initialX) * 0.1;
          const expectedY = initialY + (desiredY - initialY) * 0.1;

          // Camera should move toward target but not snap instantly
          expect(camera.x).toBeCloseTo(expectedX, 5);
          expect(camera.y).toBeCloseTo(expectedY, 5);

          // Camera should not snap to target position (unless already there)
          const distanceToTarget = Math.sqrt(
            Math.pow(desiredX - initialX, 2) + Math.pow(desiredY - initialY, 2)
          );
          if (distanceToTarget > 1) {
            // Should move closer but not reach target in one frame
            const newDistance = Math.sqrt(
              Math.pow(desiredX - camera.x, 2) + Math.pow(desiredY - camera.y, 2)
            );
            expect(newDistance).toBeLessThan(distanceToTarget);
            expect(newDistance).toBeGreaterThan(0.1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 30: Camera Bounds Clamping
   * 
   * For any camera position after update, if level bounds are set, the camera
   * position should be clamped such that:
   * - camera.x >= bounds.x
   * - camera.x + camera.width <= bounds.x + bounds.w
   * - camera.y >= bounds.y
   * - camera.y + camera.height <= bounds.y + bounds.h
   * 
   * Validates: Requirements 12.6
   */
  test('Feature: cinematic-platformer, Property 30: Camera Bounds Clamping', () => {
    fc.assert(
      fc.property(
        fc.record({
          boundsX: fc.float({ min: 0, max: 100, noNaN: true }),
          boundsY: fc.float({ min: 0, max: 100, noNaN: true }),
          boundsW: fc.float({ min: 500, max: 2000, noNaN: true }),
          boundsH: fc.float({ min: 300, max: 1000, noNaN: true }),
          targetX: fc.float({ min: -500, max: 3000, noNaN: true }),
          targetY: fc.float({ min: -500, max: 2000, noNaN: true }),
        }),
        ({ boundsX, boundsY, boundsW, boundsH, targetX, targetY }) => {
          const camera = new Camera(384, 216);
          camera.setBounds(rect(boundsX, boundsY, boundsW, boundsH));
          camera.setTarget(vec2(targetX, targetY));

          // Update camera multiple times to let it reach target
          for (let i = 0; i < 100; i++) {
            camera.update(1 / 60);
          }

          // Camera should be clamped within bounds
          expect(camera.x).toBeGreaterThanOrEqual(boundsX);
          expect(camera.x + camera.width).toBeLessThanOrEqual(boundsX + boundsW);
          expect(camera.y).toBeGreaterThanOrEqual(boundsY);
          expect(camera.y + camera.height).toBeLessThanOrEqual(boundsY + boundsH);
        }
      ),
      { numRuns: 100 }
    );
  });
});

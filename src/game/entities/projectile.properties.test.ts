/**
 * Property-based tests for projectile entity
 * Tests correctness properties using fast-check
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { Projectile } from './projectile';
import { vec2 } from '../math/vec2';

describe('Feature: cinematic-platformer - Projectile Properties', () => {
  test('Property 19: Projectile Creation on Shoot', () => {
    fc.assert(
      fc.property(
        fc.record({
          posX: fc.float({ min: -1000, max: 1000, noNaN: true }),
          posY: fc.float({ min: -1000, max: 1000, noNaN: true }),
          dirX: fc.float({ min: -1, max: 1, noNaN: true }),
          dirY: fc.float({ min: -1, max: 1, noNaN: true }),
          owner: fc.constantFrom('player' as const, 'enemy' as const),
        }),
        ({ posX, posY, dirX, dirY, owner }) => {
          // Create a projectile (simulating a shoot action)
          const pos = vec2(posX, posY);
          const direction = vec2(dirX, dirY);
          const projectile = new Projectile(pos, direction, owner);
          
          // Property: Projectile should be created with correct owner
          expect(projectile.owner).toBe(owner);
          
          // Property: Projectile should be active on creation
          expect(projectile.active).toBe(true);
          
          // Property: Projectile should have velocity in the aimed direction
          // The velocity magnitude should be PROJECTILE_SPEED (200 px/s)
          const velMagnitude = Math.sqrt(
            projectile.vel.x * projectile.vel.x + 
            projectile.vel.y * projectile.vel.y
          );
          
          // If direction is zero vector, default velocity should be applied
          const dirMagnitude = Math.sqrt(dirX * dirX + dirY * dirY);
          if (dirMagnitude === 0) {
            // Should default to right direction
            expect(projectile.vel.x).toBe(200);
            expect(projectile.vel.y).toBe(0);
          } else {
            // Velocity magnitude should be 200 px/s (within floating point tolerance)
            expect(velMagnitude).toBeCloseTo(200, 1);
            
            // Velocity direction should match input direction (normalized)
            const expectedVelX = (dirX / dirMagnitude) * 200;
            const expectedVelY = (dirY / dirMagnitude) * 200;
            expect(projectile.vel.x).toBeCloseTo(expectedVelX, 1);
            expect(projectile.vel.y).toBeCloseTo(expectedVelY, 1);
          }
          
          // Property: Projectile should have correct initial position
          expect(projectile.pos.x).toBe(posX);
          expect(projectile.pos.y).toBe(posY);
          
          // Property: Projectile should have collision bounds
          expect(projectile.bounds).toBeDefined();
          expect(projectile.bounds.w).toBe(6); // PROJECTILE_WIDTH
          expect(projectile.bounds.h).toBe(3); // PROJECTILE_HEIGHT
          
          // Bounds should be centered on position
          expect(projectile.bounds.x).toBeCloseTo(posX - 3, 1);
          expect(projectile.bounds.y).toBeCloseTo(posY - 1.5, 1);
          
          // Property: Projectile should have damage value
          expect(projectile.damage).toBe(1);
          
          // Property: Projectile should start with zero lifetime
          expect(projectile.lifetime).toBe(0);
          
          // Property: Projectile should have max lifetime of 2000ms
          expect(projectile.maxLifetime).toBe(2000);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property: Projectile Lifetime Tracking', () => {
    fc.assert(
      fc.property(
        fc.record({
          posX: fc.float({ min: 0, max: 1000, noNaN: true }),
          posY: fc.float({ min: 0, max: 1000, noNaN: true }),
          dt: fc.float({ min: Math.fround(0.001), max: Math.fround(0.1), noNaN: true }), // Delta time in seconds
          updates: fc.integer({ min: 1, max: 100 }),
        }),
        ({ posX, posY, dt, updates }) => {
          const projectile = new Projectile(
            vec2(posX, posY),
            vec2(1, 0),
            'player'
          );
          
          // Update projectile multiple times
          for (let i = 0; i < updates; i++) {
            projectile.update(dt);
          }
          
          // Property: Lifetime should accumulate correctly (up to maxLifetime)
          const expectedLifetime = Math.min(dt * 1000 * updates, 2000);
          expect(projectile.lifetime).toBeCloseTo(expectedLifetime, 1);
          
          // Property: Projectile should deactivate when lifetime exceeds max
          if (dt * 1000 * updates >= 2000) {
            expect(projectile.active).toBe(false);
          } else {
            expect(projectile.active).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property: Projectile Velocity-Based Movement', () => {
    fc.assert(
      fc.property(
        fc.record({
          posX: fc.float({ min: 0, max: 1000, noNaN: true }),
          posY: fc.float({ min: 0, max: 1000, noNaN: true }),
          dirX: fc.float({ min: -1, max: 1, noNaN: true }).filter(x => x !== 0),
          dirY: fc.float({ min: -1, max: 1, noNaN: true }).filter(y => y !== 0),
          dt: fc.float({ min: Math.fround(0.01), max: Math.fround(0.1), noNaN: true }),
        }),
        ({ posX, posY, dirX, dirY, dt }) => {
          const startPos = vec2(posX, posY);
          const direction = vec2(dirX, dirY);
          const projectile = new Projectile(startPos, direction, 'player');
          
          // Store initial velocity
          const initialVelX = projectile.vel.x;
          const initialVelY = projectile.vel.y;
          
          // Update once
          projectile.update(dt);
          
          // Property: Position should change based on velocity
          const expectedX = posX + initialVelX * dt;
          const expectedY = posY + initialVelY * dt;
          
          expect(projectile.pos.x).toBeCloseTo(expectedX, 1);
          expect(projectile.pos.y).toBeCloseTo(expectedY, 1);
          
          // Property: Collision bounds should follow position
          expect(projectile.bounds.x).toBeCloseTo(projectile.pos.x - 3, 1);
          expect(projectile.bounds.y).toBeCloseTo(projectile.pos.y - 1.5, 1);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property: Projectile Destruction', () => {
    fc.assert(
      fc.property(
        fc.record({
          posX: fc.float({ min: 0, max: 1000, noNaN: true }),
          posY: fc.float({ min: 0, max: 1000, noNaN: true }),
        }),
        ({ posX, posY }) => {
          const projectile = new Projectile(
            vec2(posX, posY),
            vec2(1, 0),
            'player'
          );
          
          // Property: Projectile should be active initially
          expect(projectile.active).toBe(true);
          
          // Call destroy
          projectile.destroy();
          
          // Property: Projectile should be inactive after destroy
          expect(projectile.active).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

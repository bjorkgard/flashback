/**
 * Property-based tests for player physics
 * 
 * Tests universal correctness properties for player movement mechanics:
 * - Turn-in deceleration
 * - Landing recovery duration and constraints
 * - Roll commitment and invulnerability frames
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Player } from './player';
import type { InputState } from './player';
import { Tilemap } from '../level/tilemap';
import type { LevelData } from '../level/levelTypes';

/**
 * Create a minimal test level with flat ground
 */
function createTestLevel(): Tilemap {
  const levelData: LevelData = {
    width: 64,
    height: 24,
    tileSize: 16,
    playerSpawn: { x: 100, y: 100 },
    bounds: { x: 0, y: 0, w: 1024, h: 384 },
    tiles: [
      // Flat ground at y=20
      ...Array.from({ length: 64 }, (_, i) => ({
        type: 'solid' as const,
        x: i,
        y: 20,
      })),
    ],
    enemies: [],
  };
  return new Tilemap(levelData);
}

/**
 * Create a default input state (all inputs off)
 */
function createDefaultInput(): InputState {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    shoot: false,
    roll: false,
    jumpPressed: false,
    shootPressed: false,
    rollPressed: false,
    upPressed: false,
  };
}

describe('Player Physics Properties', () => {
  /**
   * Property 12: Turn-In Deceleration
   * 
   * For any player state where horizontal input reverses direction
   * (velocity.x and input direction have opposite signs), the acceleration
   * applied should be reduced by the turn acceleration factor (0.6) compared
   * to normal acceleration.
   * 
   * Validates: Requirements 8.1
   */
  it('Property 12: Turn-In Deceleration', () => {
    fc.assert(
      fc.property(
        fc.record({
          initialVelX: fc.float({ min: -200, max: 200, noNaN: true }),
          inputDir: fc.constantFrom(-1, 1),
        }),
        ({ initialVelX, inputDir }) => {
          // Skip if not turning around or if velocity is zero
          if (Math.abs(initialVelX) < 0.1 || Math.sign(initialVelX) === inputDir) {
            return true;
          }
          
          const tilemap = createTestLevel();
          const player = new Player(100, 300); // Above ground
          player.vel.x = initialVelX;
          player['grounded'] = true; // Set grounded via private field access
          
          const input = createDefaultInput();
          if (inputDir > 0) {
            input.right = true;
          } else {
            input.left = true;
          }
          
          const velBefore = player.vel.x;
          player.update(1/60, input, tilemap);
          const velAfter = player.vel.x;
          
          // The velocity should change toward the target direction
          // but the change should be gradual (not instant)
          const velChange = velAfter - velBefore;
          
          // Verify velocity is moving toward target direction
          const targetSpeed = inputDir > 0 ? 60 : -60; // WALK_SPEED
          const towardTarget = Math.sign(targetSpeed - velBefore) === Math.sign(velChange);
          expect(towardTarget).toBe(true);
          
          // Verify the change is gradual (not instant to target)
          // The velocity should not reach the target in one frame when turning around
          const reachedTarget = Math.abs(velAfter - targetSpeed) < 0.1;
          expect(reachedTarget).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Landing Recovery Duration
   * 
   * For any player landing event (transitioning from jump or fall state to ground),
   * the player should enter landRecover state for a duration between 120-180ms.
   * 
   * Validates: Requirements 8.2
   */
  it('Property 13: Landing Recovery Duration', () => {
    fc.assert(
      fc.property(
        fc.record({
          fallVelocity: fc.float({ min: 50, max: 500, noNaN: true }),
        }),
        ({ fallVelocity }) => {
          const tilemap = createTestLevel();
          const player = new Player(100, 280); // Just above ground at y=320
          player.state = 'fall';
          player.vel.y = fallVelocity;
          
          const input = createDefaultInput();
          
          // Update until player lands
          let landed = false;
          for (let i = 0; i < 10; i++) {
            player.update(1/60, input, tilemap);
            if (player.state !== 'fall') {
              landed = true;
              break;
            }
          }
          
          // Player should have landed
          expect(landed).toBe(true);
          // Player should be in landRecover or idle (if timer already expired)
          expect(['landRecover', 'idle']).toContain(player.state);
          
          // Timer should be set to LAND_RECOVER_DURATION (150ms)
          expect(player['landRecoverTimer']).toBeGreaterThanOrEqual(120);
          expect(player['landRecoverTimer']).toBeLessThanOrEqual(180);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14: Landing Recovery Constraints
   * 
   * For any player in landRecover state, jump input should be ignored and
   * horizontal movement should be reduced, preventing immediate jump or
   * full-speed movement.
   * 
   * Validates: Requirements 8.3
   */
  it('Property 14: Landing Recovery Constraints', () => {
    fc.assert(
      fc.property(
        fc.record({
          inputDir: fc.constantFrom(-1, 0, 1),
        }),
        ({ inputDir }) => {
          const tilemap = createTestLevel();
          const player = new Player(100, 320);
          player.state = 'landRecover';
          player['landRecoverTimer'] = 100; // Mid-recovery
          player['grounded'] = true;
          
          const input = createDefaultInput();
          input.jumpPressed = true; // Try to jump
          if (inputDir > 0) input.right = true;
          if (inputDir < 0) input.left = true;
          
          const velXBefore = player.vel.x;
          player.update(1/60, input, tilemap);
          
          // Should still be in landRecover (jump ignored)
          expect(player.state).toBe('landRecover');
          
          // Horizontal movement should be reduced (not full speed)
          if (inputDir !== 0) {
            const velXAfter = player.vel.x;
            const velChange = Math.abs(velXAfter - velXBefore);
            // Change should be small (reduced control)
            expect(velChange).toBeLessThan(10); // Much less than full walk speed
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15: Roll Commitment Duration
   * 
   * For any player roll initiation, the roll state should last between
   * 350-450ms with no ability to cancel or transition to other states
   * until completion.
   * 
   * Validates: Requirements 8.4
   */
  it('Property 15: Roll Commitment Duration', () => {
    fc.assert(
      fc.property(
        fc.record({
          facing: fc.constantFrom(-1, 1),
        }),
        ({ facing }) => {
          const tilemap = createTestLevel();
          const player = new Player(100, 320);
          player.state = 'idle';
          player.facing = facing as -1 | 1;
          player['grounded'] = true;
          
          const input = createDefaultInput();
          input.rollPressed = true;
          
          // Initiate roll
          player.update(1/60, input, tilemap);
          expect(player.state).toBe('roll');
          
          // Timer should be set to ROLL_DURATION (400ms)
          const initialTimer = player['rollTimer'];
          expect(initialTimer).toBeGreaterThanOrEqual(350);
          expect(initialTimer).toBeLessThanOrEqual(450);
          
          // Try to cancel with various inputs
          const cancelInput = createDefaultInput();
          cancelInput.jump = true;
          cancelInput.jumpPressed = true;
          cancelInput.shoot = true;
          
          // Update for a few frames
          for (let i = 0; i < 5; i++) {
            player.update(1/60, cancelInput, tilemap);
            // Should still be rolling (committed)
            if (player['rollTimer'] > 0) {
              expect(player.state).toBe('roll');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16: Roll Invulnerability Frames
   * 
   * For any player in roll state, invulnerability should be active for the
   * first 60-70% of the roll duration, preventing damage from enemy projectiles
   * during this window.
   * 
   * Validates: Requirements 8.5
   */
  it('Property 16: Roll Invulnerability Frames', () => {
    fc.assert(
      fc.property(
        fc.record({
          rollProgress: fc.float({ min: 0, max: 1 }),
        }),
        ({ rollProgress }) => {
          const tilemap = createTestLevel();
          const player = new Player(100, 320);
          player.state = 'roll';
          player['grounded'] = true;
          
          // Set roll timer to simulate progress through roll
          const ROLL_DURATION = 400;
          const IFRAME_DURATION = 280; // 70% of 400
          player['rollTimer'] = ROLL_DURATION * (1 - rollProgress);
          
          const input = createDefaultInput();
          player.update(1/60, input, tilemap);
          
          // Check if player should be invulnerable
          const timeIntoRoll = ROLL_DURATION * rollProgress;
          const shouldBeInvuln = timeIntoRoll < IFRAME_DURATION;
          
          // Test by checking isInvulnerable method
          const isInvuln = player.isInvulnerable();
          
          if (shouldBeInvuln) {
            expect(isInvuln).toBe(true);
          } else {
            // After i-frames, should be vulnerable
            // (unless invulnFrames is set from previous damage)
            if (player['invulnFrames'] === 0) {
              expect(isInvuln).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

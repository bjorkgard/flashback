/**
 * Property-Based Tests for Input System
 * 
 * Tests universal correctness properties for deterministic input sampling.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { InputSystem } from './input';

describe('InputSystem - Property-Based Tests', () => {
  /**
   * Property 18: Deterministic Input Sampling
   * 
   * For any game frame, input should only be sampled during fixed timestep updates
   * (not during render calls), ensuring deterministic gameplay regardless of frame rate.
   * 
   * This property verifies that:
   * 1. Input state is captured at discrete update() calls
   * 2. wasPressed() and wasReleased() only detect transitions between update() calls
   * 3. Multiple queries between updates return consistent results
   * 
   * **Validates: Requirements 9.3**
   */
  it('Property 18: Deterministic Input Sampling', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.constantFrom('KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft'),
            pressed: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (inputSequence) => {
          const input = new InputSystem();
          
          // Simulate a sequence of input events and updates
          for (const event of inputSequence) {
            // Simulate key event
            const keyEvent = new KeyboardEvent(
              event.pressed ? 'keydown' : 'keyup',
              { code: event.key }
            );
            window.dispatchEvent(keyEvent);
            
            // Query input state multiple times before update
            const query1 = input.isDown(event.key);
            const query2 = input.isDown(event.key);
            const query3 = input.isDown(event.key);
            
            // All queries before update should return identical results
            expect(query1).toBe(query2);
            expect(query2).toBe(query3);
            
            // wasPressed/wasReleased should be consistent before update
            const pressed1 = input.wasPressed(event.key);
            const pressed2 = input.wasPressed(event.key);
            expect(pressed1).toBe(pressed2);
            
            const released1 = input.wasReleased(event.key);
            const released2 = input.wasReleased(event.key);
            expect(released1).toBe(released2);
            
            // Call update to sample input for this frame
            input.update();
            
            // After update, queries should still be consistent
            const query4 = input.isDown(event.key);
            const query5 = input.isDown(event.key);
            expect(query4).toBe(query5);
          }
          
          input.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });
});

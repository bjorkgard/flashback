# Testing Guide

## Overview

The project uses a dual testing approach combining unit tests and property-based tests to ensure correctness and reliability.

## Test Statistics

- **219 total tests** (all passing)
- **25 test files** across all modules
- **30 correctness properties** fully implemented and validated
- 100% test success rate

## Testing Frameworks

### Vitest
- Modern test runner with fast execution
- Hot module reloading for test development
- Built-in coverage reporting
- Compatible with Vite build system

### fast-check
- Property-based testing library for TypeScript
- Generates hundreds of test cases automatically
- Finds edge cases that manual tests miss
- Minimum 100 iterations per property test

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode for development
npm test -- --watch

# Run tests with UI
npm test:ui

# Run specific test file
npm test vec2.test.ts

# Run tests with coverage
npm test -- --coverage
```

### Test File Patterns

- `*.test.ts` - Unit tests for TypeScript modules
- `*.test.tsx` - Unit tests for React components
- `*.properties.test.ts` - Property-based tests

## Test Coverage by Module

### Math Utilities
- **Vec2**: 18 unit tests covering all operations and edge cases
- **Rect**: 18 unit tests for intersection and containment

### Palette Generation
- **Property 3**: Palette generation determinism (100 iterations)
- **Property 4**: Complete palette structure validation
- **Property 5**: Palette jitter bounds checking
- **Property 6**: Suit primary originality constraints
- **Property 7**: Suit color separation requirements
- **Property 8**: Quantized luminance ramps
- 14 unit tests for color conversion and edge cases

### Sprite Generation
- **Property 2**: Sprite generation determinism (100 iterations)
- **Property 9**: Correct sprite dimensions validation
- **Property 10**: Complete animation frame sets (100 iterations)
- **Property 11**: Non-placeholder sprites verification

### Rendering System
- **Property 1**: Aspect ratio preservation (100 iterations)
- **Property 29**: Smooth camera follow behavior
- **Property 30**: Camera bounds clamping
- 9 unit tests for renderer initialization and configuration

### Level System
- **Property 17**: Ledge grab precision (100 iterations)
- **Property 21**: Projectile collision detection
- **Property 28**: Axis-by-axis collision resolution
- 16 unit tests for tilemap operations
- 11 unit tests for raycasting
- 15 unit tests for sample level validation

### Entity System

#### Player
- **Property 12**: Turn-in deceleration (100 iterations)
- **Property 13**: Landing recovery duration
- **Property 14**: Landing recovery constraints
- **Property 15**: Roll commitment duration
- **Property 16**: Roll invulnerability frames
- **Property 19**: Projectile creation on shoot
- **Property 20**: Shoot cooldown enforcement
- **Property 22**: Hit effects application
- **Property 23**: Roll evasion mechanics
- 26 unit tests for state transitions and physics

#### Enemy
- **Property 24**: Patrol waypoint following (100 iterations)
- **Property 25**: Line-of-sight detection
- **Property 26**: Alert state behavior
- **Property 27**: Enemy shooting behavior
- 21 unit tests for AI and combat

#### Projectile
- 4 property tests for collision and lifetime

### Game Loop and Input
- **Property 18**: Deterministic input sampling (100 iterations)
- 10 unit tests for fixed timestep and accumulator
- 1 property test for input system

### UI Components
- 4 tests per component (StartMenu, PauseMenu, GameOver, Win)
- Button click handlers
- State transitions
- Control instructions display

### Integration
- 10 tests for game initialization and state management
- Win/lose condition validation
- State transition flows

## Property-Based Testing

### What are Property Tests?

Property tests verify universal truths about your code by:
1. Generating hundreds of random test cases
2. Checking that properties hold for all cases
3. Shrinking failures to minimal examples
4. Finding edge cases you didn't think of

### Example Properties

**Determinism**: Same seed always produces same output
```typescript
fc.assert(
  fc.property(fc.string(), (seed) => {
    const result1 = generatePalette(seed);
    const result2 = generatePalette(seed);
    expect(result1).toEqual(result2);
  }),
  { numRuns: 100 }
);
```

**Bounds Checking**: Values stay within valid ranges
```typescript
fc.assert(
  fc.property(fc.integer(), fc.integer(), (x, y) => {
    const camera = new Camera(vec2(x, y), bounds, 384, 216);
    const pos = camera.getPosition();
    expect(pos.x).toBeGreaterThanOrEqual(0);
    expect(pos.x).toBeLessThanOrEqual(maxX);
  }),
  { numRuns: 100 }
);
```

**Invariants**: Conditions that must always be true
```typescript
fc.assert(
  fc.property(fc.float(), (dt) => {
    player.update(dt, input, tilemap);
    if (player.state === 'roll') {
      expect(player.isInvulnerable()).toBe(true);
    }
  }),
  { numRuns: 100 }
);
```

## Unit Testing

### What are Unit Tests?

Unit tests verify specific examples and edge cases:
- Known input/output pairs
- Boundary conditions
- Error handling
- State transitions

### Example Unit Tests

**Known Values**
```typescript
test('vec2 addition', () => {
  const a = vec2(1, 2);
  const b = vec2(3, 4);
  const result = add(a, b);
  expect(result).toEqual({ x: 4, y: 6 });
});
```

**Edge Cases**
```typescript
test('normalize zero vector', () => {
  const zero = vec2(0, 0);
  const result = normalize(zero);
  expect(result).toEqual({ x: 0, y: 0 });
});
```

**State Transitions**
```typescript
test('player transitions from idle to walk', () => {
  const player = new Player(0, 0);
  player.update(0.016, { right: true }, tilemap);
  expect(player.state).toBe('walk');
});
```

## Writing Tests

### Test Organization

Co-locate tests with source files:
```
src/game/math/
  vec2.ts
  vec2.test.ts
  rect.ts
  rect.test.ts
```

### Test Structure

```typescript
import { describe, test, expect } from 'vitest';
import { functionToTest } from './module';

describe('Module Name', () => {
  describe('function name', () => {
    test('should do something specific', () => {
      // Arrange
      const input = createInput();
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Property Test Structure

```typescript
import { describe, test } from 'vitest';
import fc from 'fast-check';

describe('Property Tests', () => {
  test('Property: Description', () => {
    fc.assert(
      fc.property(
        fc.integer(), // Arbitrary generator
        (value) => {
          // Test the property
          const result = functionToTest(value);
          expect(result).toSatisfyProperty();
        }
      ),
      { numRuns: 100 } // Run 100 random cases
    );
  });
});
```

## Best Practices

### Do's
- ✅ Write tests before or alongside implementation
- ✅ Test both happy paths and edge cases
- ✅ Use descriptive test names
- ✅ Keep tests focused and isolated
- ✅ Use property tests for universal truths
- ✅ Use unit tests for specific examples
- ✅ Mock external dependencies
- ✅ Test error conditions

### Don'ts
- ❌ Don't test implementation details
- ❌ Don't write flaky tests
- ❌ Don't skip edge cases
- ❌ Don't test third-party libraries
- ❌ Don't make tests dependent on each other
- ❌ Don't use magic numbers without explanation

## Debugging Failed Tests

### Read the Error Message
```
Expected: { x: 4, y: 6 }
Received: { x: 3, y: 6 }
```

### Use Console Logging
```typescript
test('debug example', () => {
  console.log('Input:', input);
  const result = functionToTest(input);
  console.log('Result:', result);
  expect(result).toBe(expected);
});
```

### Run Single Test
```bash
npm test -- vec2.test.ts
```

### Use Vitest UI
```bash
npm test:ui
```

## Continuous Integration

Tests run automatically on:
- Every commit (local pre-commit hook)
- Pull requests (CI pipeline)
- Before deployment

All tests must pass before merging code.

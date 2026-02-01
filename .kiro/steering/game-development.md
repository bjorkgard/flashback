---
inclusion: manual
---

# Game Development Guidelines

This steering file provides specific guidance for implementing the cinematic platformer game. Reference this when working on game-specific features.

## Procedural Generation Principles

### Deterministic Seeding
- **Always** use string seeds converted to numeric via `hashStringToSeed()`
- **Never** use `Math.random()` - always use seeded RNG (`mulberry32`)
- Same seed must produce identical output across all runs
- Use distinct seed prefixes: `PLAYER_`, `ENEMY_HUMANOID_`, `ENEMY_DRONE_`, `TILE_`, `PALETTE_`

### Palette Generation
- Generate 32-40 colors organized into material ramps
- Apply HSL jitter: ±5° hue, ±0.04 saturation, ±0.03 luminance
- Enforce originality constraints:
  - suitPrimary hue differs from 210° and 15° by >15°
  - suitSecondary differs from suitPrimary by ≥60°
- Use quantized luminance steps (3-5 per ramp), no smooth gradients

### Sprite Generation Pipeline
1. **Silhouette**: Generate basic shape mask (capsule, rectangle)
2. **Regions**: Partition into material zones
3. **Lighting**: Apply quantized color ramps
4. **Dithering**: Apply 4×4 Bayer ordered dithering
5. **Outline**: Add 1px outline with 2px bottom weight
6. **Rim Light**: Add highlights on edges
7. **Details**: Add micro-features (bolts, seams, vents)
8. **Animation**: Generate frame variations

## Physics and Movement

### Player Physics Constants
```typescript
WALK_SPEED: 60        // px/s
RUN_SPEED: 120        // px/s
JUMP_VELOCITY: -240   // px/s (negative is up)
GRAVITY: 800          // px/s²
FRICTION: 0.85        // ground friction
AIR_FRICTION: 0.98    // air resistance
TURN_ACCEL: 0.6       // when reversing direction
```

### Movement Mechanics
- **Turn-in deceleration**: Slower acceleration when reversing (0.6x)
- **Landing recovery**: 120-180ms reduced control after landing
- **Roll commitment**: 350-450ms duration, cannot cancel
- **Roll i-frames**: First 60-70% of roll duration
- **Ledge grab**: ±2px tolerance for alignment

### State Machine
Player states: idle, walk, run, jump, fall, landRecover, crouch, roll, hang, climbUp, climbDown, aim, shoot, hurt, dead

Transitions must be explicit and validated. No state should be reachable from all other states.

## Collision Detection

### AABB Collision
- Use axis-by-axis resolution (X first, then Y)
- Check tile collision using `getTileAt(x, y)`
- One-way platforms: only collide from above (velocity.y > 0)
- Ledge detection: check for solid tile at hand level, empty above

### Collision Response
1. Move entity by velocity.x * dt
2. Check and resolve X-axis tile collisions
3. Move entity by velocity.y * dt
4. Check and resolve Y-axis tile collisions
5. Check entity-to-entity collisions (projectiles, enemies)

### Raycasting
- Use DDA algorithm for grid traversal
- Used for enemy line-of-sight detection
- Return first solid tile hit along ray

## Rendering Pipeline

### Canvas Setup
- Internal buffer: 384×216 OffscreenCanvas
- Display canvas: Scales internal buffer with `imageSmoothingEnabled = false`
- Aspect ratio: 16:9 with letterboxing/pillarboxing
- Clear color: `palette.bgNight.colors[0]`

### Render Order
1. Clear internal buffer
2. Apply camera transform (translate by -camera.x, -camera.y)
3. Render background layer
4. Render tilemap (with viewport culling)
5. Render entities (sorted by y-position for depth)
6. Restore transform
7. Render HUD (no camera transform)
8. Scale to display canvas

### Camera Behavior
- Smooth follow with lerp (factor ~0.1)
- Look-ahead based on player velocity
- Clamp to level bounds
- Update after all entity updates

## Game Loop Architecture

### Fixed Timestep Pattern
```typescript
const FIXED_DT = 1000 / 60; // 16.67ms
let accumulator = 0;

function loop(currentTime) {
  const deltaTime = currentTime - lastTime;
  accumulator += deltaTime;
  
  while (accumulator >= FIXED_DT) {
    fixedUpdate(FIXED_DT / 1000); // Convert to seconds
    accumulator -= FIXED_DT;
  }
  
  const alpha = accumulator / FIXED_DT;
  render(alpha);
}
```

### Update Order
1. Sample input (deterministic)
2. Update player
3. Update enemies (AI, movement)
4. Update projectiles
5. Check collisions (projectile vs entity, entity vs tile)
6. Update camera
7. Check win/lose conditions

## Testing Strategy

### Unit Tests
- Test specific examples with known values
- Test edge cases (zero vectors, out-of-bounds, null checks)
- Test state transitions and animation timing
- Test error handling (invalid JSON, NaN in physics)

### Property-Based Tests
- Use `fast-check` with minimum 100 iterations
- Test universal properties across randomized inputs
- Custom generators for game types (Vec2, Rect, states)
- Tag tests: `Feature: cinematic-platformer, Property N: [text]`

### Test Organization
- Co-locate tests with source: `vec2.ts` → `vec2.test.ts`
- Property tests: `player.properties.test.ts`
- Integration tests: `__tests__/integration/`

## Error Handling

### Never Crash
- Validate all inputs (dimensions, coordinates, indices)
- Use fallbacks for missing data (default palette, empty level)
- Log errors to console but continue execution
- Clamp invalid values (NaN → 0, Infinity → max safe value)

### Specific Handlers
- **Invalid seed**: Use default seed "DEFAULT_SPRITE"
- **Out-of-bounds tile**: Return null, treat as empty
- **Missing animation**: Use "idle" as fallback
- **Frame index overflow**: Use modulo to wrap
- **Context loss**: Show error screen with reload button

## Performance Considerations

### Sprite Caching
- Cache generated sprites by seed in Map
- Generate all animations on first request
- Never regenerate same sprite twice

### Viewport Culling
- Only render tiles visible in camera viewport
- Calculate visible tile range: `startX = floor(camera.x / 16)`
- Skip entities outside camera bounds (with margin)

### Memory Management
- Reuse ImageData objects where possible
- Remove inactive projectiles from array
- Limit particle count (if implemented)

## Originality Requirements

### Legal Safety
- **Never** replicate copyrighted character designs
- **Never** use placeholder rectangles in final build
- **Never** match iconic game palettes (Metroid, Mega Man, etc.)
- All assets must be procedurally generated at runtime
- No external image files (except minimal UI icons if needed)

### Visual Quality
- Sprites must have non-uniform pixel data (>10% non-transparent)
- Apply dithering for texture depth
- Add outlines and rim lights for definition
- Include micro-details (bolts, seams, vents)
- Ensure animations have distinct poses per frame

# Product Overview

**Flashback** is a 2D pixel-art cinematic platformer game built with React, TypeScript, and Vite. The game features procedurally generated art, weighty deliberate movement mechanics inspired by early 90s cinematic sci-fi platformers, and a complete rendering pipeline with deterministic seeded generation.

## Current State
- ✅ Math utilities (Vec2, Rect) with comprehensive tests
- 🚧 In development: RNG, palette generation, sprite generation
- 🚧 Planned: Entity system, physics, collision, rendering, game loop

## Key Features
- **Procedural Art**: All sprites, tiles, and palettes generated at runtime from seeds
- **Pixel-Perfect Rendering**: 384×216 internal resolution with nearest-neighbor scaling
- **Weighty Movement**: Deliberate physics with momentum, landing recovery, committed rolls
- **Fixed Timestep**: 60Hz update loop with accumulator pattern
- **Dual UI**: Tailwind CSS menus + canvas-based HUD with procedural bitmap font

## Development Approach
- Spec-driven development with requirements → design → tasks workflow
- Property-based testing for correctness guarantees (30 properties)
- Unit tests for specific examples and edge cases
- Bottom-up implementation: foundations → rendering → entities → integration

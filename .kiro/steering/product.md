# Product Overview

**Flashback** is a 2D pixel-art cinematic platformer game built with React, TypeScript, and Vite. The game features procedurally generated art, weighty deliberate movement mechanics inspired by early 90s cinematic sci-fi platformers, and a complete rendering pipeline with deterministic seeded generation.

## Current State
- ✅ Math utilities (Vec2, Rect) with comprehensive tests and JSDoc
- ✅ RNG and palette generation with property-based tests and JSDoc
- ✅ Sprite generation pipeline with 8-step procedural art system and JSDoc
- ✅ Rendering system (Camera, Renderer) with aspect ratio preservation and JSDoc
- ✅ Level system (Tilemap, collision, raycasting) with complete JSDoc
- ✅ Entity system (Player, Enemy, Projectile) with state machines and JSDoc
- 🚧 In development: Entity physics refinement (11 failing tests)
- 🚧 Planned: Game loop, input handling, UI components, integration

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

# Project Structure

## Directory Organization

```
flashback/
├── src/                    # Application source code
│   ├── main.tsx           # Application entry point
│   ├── App.tsx            # Root component with game integration
│   ├── App.css            # Component styles
│   ├── index.css          # Global styles (includes Tailwind)
│   ├── game/              # Game engine and logic
│   │   ├── engine/        # Core systems (loop ✅, input ✅, time ✅) JSDoc ✅
│   │   ├── math/          # Math utilities (vec2 ✅, rect ✅) JSDoc ✅
│   │   ├── render/        # Rendering (sprites ✅, palette ✅, camera ✅, renderer ✅) JSDoc ✅
│   │   ├── entities/      # Game entities (player ✅, enemies ✅, projectiles ✅) JSDoc ✅
│   │   └── level/         # Level data (tilemap ✅, collision ✅, raycast ✅) JSDoc ✅
│   ├── ui/                # React UI components (menus ✅, overlays ✅) JSDoc ✅
│   ├── test/              # Test setup and utilities ✅
│   └── assets/            # Static assets (minimal - most art is procedural)
├── docs/                  # Documentation
│   ├── API.md            # Complete API reference
│   ├── ARCHITECTURE.md   # Project structure and patterns
│   ├── DEVELOPMENT.md    # Development guide
│   └── TESTING.md        # Testing guide
├── public/                # Public static files
├── .kiro/                 # Kiro configuration
│   ├── specs/             # Feature specifications
│   │   └── cinematic-platformer/  # Current spec
│   └── steering/          # Development guidance
├── node_modules/          # Dependencies
└── dist/                  # Build output (generated)
```

## File Conventions

### TypeScript Files
- **Components**: `.tsx` extension for React components
- **Game Logic**: `.ts` extension for game systems and utilities
- **Tests**: `.test.ts` or `.test.tsx` co-located with source files
- **Property Tests**: `.properties.test.ts` for property-based tests
- **Imports**: Use relative imports within game/ directory

### Testing
- Unit tests: Test specific examples and edge cases
- Property tests: Test universal correctness properties with fast-check
- Co-locate tests with source: `vec2.ts` → `vec2.test.ts`
- Test organization: `__tests__/` folders for complex modules

### Styling
- Tailwind CSS for UI overlays (menus, buttons)
- Canvas-based rendering for game graphics (no CSS)
- Global styles: `src/index.css` with Tailwind directives

### Entry Points
- **HTML**: `index.html` at root (Vite convention)
- **JS Entry**: `src/main.tsx` renders root component
- **Root Component**: `src/App.tsx` manages game lifecycle and UI state

## Code Patterns

### Game Module Structure
- Pure functions for math and utilities
- Classes for stateful systems (Renderer, Camera, GameLoop)
- Interfaces for entities (Player, Enemy, Projectile)
- Deterministic RNG using mulberry32 with string seeds

### Component Structure
- Functional components with hooks
- StrictMode wrapper in main entry
- Type-safe props with TypeScript interfaces
- Game state managed in App.tsx, passed to UI components

### Import Order Convention
1. React imports (for UI components)
2. Third-party libraries (fast-check, etc.)
3. Game modules (engine, entities, render)
4. Local utilities and types
5. Styles (CSS imports last)

### Naming Conventions
- **Components**: PascalCase (e.g., `StartMenu.tsx`, `GameOver.tsx`)
- **Game Classes**: PascalCase (e.g., `Renderer`, `Camera`, `GameLoop`)
- **Functions**: camelCase (e.g., `generatePalette`, `checkCollision`)
- **Types/Interfaces**: PascalCase (e.g., `Vec2`, `Rect`, `Entity`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `WALK_SPEED`, `JUMP_VELOCITY`)

## Implementation Guidelines

### Completed Modules

#### Math Utilities (✅ Complete)
- `vec2.ts`: 2D vector operations (add, sub, mul, length, normalize, lerp)
- `rect.ts`: Rectangle operations (intersects, contains) for AABB collision
- Comprehensive unit tests with edge cases (zero vectors, negative coords)
- Full JSDoc documentation

#### RNG and Palette Generation (✅ Complete)
- `palette.ts`: Seeded RNG (mulberry32) with string-to-seed hashing
- Deterministic palette generation with 11 material ramps
- HSL to hex color conversion
- Originality constraints for suit colors
- Property-based tests for determinism and structure
- Full JSDoc documentation

#### Sprite Generation (✅ Complete)
- `sprites.ts`: 8-step procedural art pipeline
- Silhouette generation, region partitioning, lighting, dithering
- Outline, rim light, and micro-detail passes
- Animation frame generation for all entity types
- Sprite caching for performance
- Property-based tests for determinism and completeness
- Full JSDoc documentation

#### Rendering System (✅ Complete)
- `camera.ts`: Smooth follow with lerp and look-ahead
- `renderer.ts`: Pixel-perfect rendering with offscreen buffer
- Aspect ratio preservation with letterboxing/pillarboxing
- Property-based tests for camera and renderer
- Full JSDoc documentation

#### Level System (✅ Complete)
- `tilemap.ts`: Level loading and tile access
- `collision.ts`: Axis-by-axis AABB collision detection
- `raycast.ts`: DDA raycasting for line-of-sight
- `tileTypes.ts`, `levelTypes.ts`: Type definitions
- Property-based tests for collision
- Full JSDoc documentation

#### Entity System (✅ Complete)
- `entity.ts`: Base entity interface
- `player.ts`: Player with state machine and physics
- `enemy.ts`: Enemy AI with patrol, alert, shoot states
- `projectile.ts`: Projectile with velocity-based movement
- Property-based tests for entity behavior
- Full JSDoc documentation

### Next Steps
- Additional levels and content
- Polish and refinement

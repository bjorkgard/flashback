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
│   │   ├── engine/        # Core systems (loop, input, time)
│   │   ├── math/          # Math utilities (vec2, rect) ✅
│   │   ├── render/        # Rendering (sprites, palette, camera, renderer)
│   │   ├── entities/      # Game entities (player, enemies, projectiles)
│   │   └── level/         # Level data (tilemap, collision, raycast)
│   ├── ui/                # React UI components (menus, overlays)
│   ├── test/              # Test setup and utilities
│   └── assets/            # Static assets (minimal - most art is procedural)
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

### Math Utilities (✅ Complete)
- `vec2.ts`: 2D vector operations (add, sub, mul, length, normalize, lerp)
- `rect.ts`: Rectangle operations (intersects, contains) for AABB collision
- Comprehensive unit tests with edge cases (zero vectors, negative coords)

### Next Steps
- RNG and palette generation (deterministic seeded generation)
- Sprite generation pipeline (8-step procedural art)
- Rendering system (canvas, camera, aspect ratio preservation)
- Entity system (player, enemies, projectiles)
- Collision detection (axis-by-axis AABB)
- Game loop (fixed 60Hz timestep with accumulator)

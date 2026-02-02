# Architecture

## Project Structure

```
flashback/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component with game integration
│   ├── game/                 # Game engine and logic
│   │   ├── engine/           # Core systems (loop ✅, input ✅, time ✅) JSDoc ✅
│   │   ├── math/             # Math utilities (vec2 ✅, rect ✅) JSDoc ✅
│   │   ├── render/           # Rendering (sprites ✅, palette ✅, camera ✅, renderer ✅) JSDoc ✅
│   │   ├── entities/         # Game entities (player ✅, enemies ✅, projectiles ✅) JSDoc ✅
│   │   └── level/            # Level data (tilemap ✅, collision ✅, raycast ✅) JSDoc ✅
│   ├── ui/                   # React UI components (menus ✅, overlays ✅) JSDoc ✅
│   └── test/                 # Test setup and utilities ✅
├── docs/                     # Documentation
├── .kiro/                    # Kiro configuration
│   ├── specs/                # Feature specifications
│   └── steering/             # Development guidance
└── public/                   # Public static files
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

## Game Architecture Patterns

### Fixed Timestep
- 60Hz update loop with accumulator pattern
- Separates physics updates from rendering
- Ensures consistent gameplay across different frame rates

### Entity-Component
- Interface-based entity system
- Entities implement common interface (pos, vel, bounds, update, render)
- Composition over inheritance

### Deterministic RNG
- mulberry32 algorithm with string-to-seed hashing
- Ensures reproducible procedural generation
- All art generated from seeds

### State Machines
- Player and enemy behavior managed by state machines
- Clear state transitions with explicit conditions
- Prevents invalid state combinations

### AABB Collision
- Axis-by-axis rectangle collision detection
- Efficient broad-phase culling
- Precise collision response with penetration resolution

## Canvas and Rendering

### Rendering Pipeline
1. **Offscreen Buffer**: Internal 384×216 canvas for pixel-perfect rendering
2. **Game Rendering**: Tiles, entities, and effects drawn to buffer
3. **Scaling**: Buffer scaled to display canvas with nearest-neighbor filtering
4. **Letterboxing**: Black bars added to preserve 16:9 aspect ratio

### Image Smoothing
- Disabled for nearest-neighbor scaling
- Preserves crisp pixel art aesthetic
- No blur or interpolation artifacts

### Aspect Ratio
- 16:9 native aspect ratio (384×216)
- Letterboxing for wider displays
- Pillarboxing for narrower displays
- Always maintains correct proportions

## Development Approach

This project follows spec-driven development with a requirements → design → tasks workflow:

1. **Requirements**: Detailed acceptance criteria for all features
2. **Design**: Complete architecture and implementation specifications
3. **Tasks**: Incremental coding tasks with testing integrated throughout
4. **Property-Based Testing**: Correctness guarantees through executable properties

See `.kiro/specs/cinematic-platformer/` for complete specifications.

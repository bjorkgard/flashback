# Flashback

![Tests](https://img.shields.io/badge/tests-102%20passing-brightgreen)
![Test Files](https://img.shields.io/badge/test%20files-11-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-7.2.4-purple)

A 2D pixel-art cinematic platformer game built with React, TypeScript, and Vite. Features procedurally generated art, weighty deliberate movement mechanics inspired by early 90s cinematic sci-fi platformers, and a complete rendering pipeline with deterministic seeded generation.

## Features

- **Procedural Art Generation**: All sprites, tiles, and palettes generated at runtime from deterministic seeds
- **Pixel-Perfect Rendering**: 384×216 internal resolution scaled with nearest-neighbor filtering
- **Weighty Movement**: Deliberate physics with momentum, landing recovery, and committed rolls
- **Fixed Timestep Engine**: 60Hz update loop with accumulator-based rendering
- **Dual UI System**: Tailwind CSS for menus, canvas-based HUD with procedural bitmap font
- **Property-Based Testing**: Comprehensive test suite with fast-check for correctness guarantees

## Current Status

✅ **Completed**
- Math utilities (Vec2, Rect) with comprehensive unit tests
- Seeded RNG (mulberry32) with string-to-seed hashing
- Palette generation with deterministic color ramps and originality constraints
- Sprite generation pipeline with 8-step procedural art system
- Rendering system (Camera, Renderer) with aspect ratio preservation
- Level system (Tilemap, collision detection, raycasting)
- Property-based tests for palette, sprites, camera, renderer, and collision

🚧 **In Development**
- Entity system (player, enemies, projectiles)
- Physics and movement mechanics
- Game loop and input handling
- UI components and integration

## Tech Stack

- **React 19.2.0** - UI framework with StrictMode enabled
- **TypeScript 5.9.3** - Type-safe development with strict mode
- **Vite 7.2.4** - Build tool and dev server with HMR
- **Vitest 4.0.18** - Unit and property-based testing framework
- **fast-check 4.5.3** - Property-based testing library
- **Tailwind CSS 4.1.18** - Utility-first CSS for UI overlays

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
# Start development server with HMR
npm run dev

# Run tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test:ui

# Lint codebase
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
flashback/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component with game integration
│   ├── game/                 # Game engine and logic
│   │   ├── engine/           # Core systems (loop, input, time)
│   │   ├── math/             # Math utilities (vec2, rect) ✅
│   │   ├── render/           # Rendering (sprites ✅, palette ✅, camera, renderer)
│   │   ├── entities/         # Game entities (player, enemies, projectiles)
│   │   └── level/            # Level data (tilemap, collision, raycast)
│   ├── ui/                   # React UI components (menus, overlays)
│   └── test/                 # Test setup and utilities
├── .kiro/                    # Kiro configuration
│   ├── specs/                # Feature specifications
│   └── steering/             # Development guidance
└── public/                   # Public static files
```

## Testing

The project uses a dual testing approach:

- **Unit Tests**: Test specific examples and edge cases
- **Property-Based Tests**: Test universal correctness properties with fast-check

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test vec2.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode for development
npm test -- --watch
```

### Test Coverage

- 102 tests passing across 11 test files
- Comprehensive coverage of math utilities (Vec2, Rect)
- Property-based tests for RNG determinism, palette generation, sprite generation, camera, renderer, and collision
- 30 correctness properties defined in design document (17 implemented, 13 in progress)

## API Documentation

### Math Utilities

#### Vec2

2D vector operations for position, velocity, and direction calculations.

```typescript
/**
 * Creates a 2D vector
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns Vec2 object
 */
function vec2(x: number, y: number): Vec2;

/**
 * Adds two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns Sum of vectors
 */
function add(a: Vec2, b: Vec2): Vec2;

/**
 * Subtracts vector b from vector a
 * @param a - First vector
 * @param b - Second vector
 * @returns Difference of vectors
 */
function sub(a: Vec2, b: Vec2): Vec2;

/**
 * Multiplies vector by scalar
 * @param v - Vector to multiply
 * @param scalar - Scalar value
 * @returns Scaled vector
 */
function mul(v: Vec2, scalar: number): Vec2;

/**
 * Calculates vector length (magnitude)
 * @param v - Vector
 * @returns Length of vector
 */
function length(v: Vec2): number;

/**
 * Normalizes vector to unit length
 * @param v - Vector to normalize
 * @returns Normalized vector (or zero vector if input is zero)
 */
function normalize(v: Vec2): Vec2;

/**
 * Linear interpolation between two vectors
 * @param a - Start vector
 * @param b - End vector
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated vector
 */
function lerp(a: Vec2, b: Vec2, t: number): Vec2;
```

#### Rect

Rectangle operations for AABB collision detection.

```typescript
/**
 * Creates a rectangle
 * @param x - X coordinate of top-left corner
 * @param y - Y coordinate of top-left corner
 * @param w - Width
 * @param h - Height
 * @returns Rect object
 */
function rect(x: number, y: number, w: number, h: number): Rect;

/**
 * Checks if two rectangles intersect
 * @param a - First rectangle
 * @param b - Second rectangle
 * @returns True if rectangles overlap
 */
function intersects(a: Rect, b: Rect): boolean;

/**
 * Checks if rectangle contains a point
 * @param r - Rectangle
 * @param p - Point to test
 * @returns True if point is inside rectangle
 */
function contains(r: Rect, p: Vec2): boolean;
```

### Palette Generation

#### RNG

Deterministic random number generation using mulberry32 algorithm.

```typescript
/**
 * Creates a seeded random number generator
 * @param seed - Numeric seed value
 * @returns Function that returns random numbers in [0, 1)
 */
function mulberry32(seed: number): () => number;

/**
 * Converts string to numeric seed
 * @param str - String to hash
 * @returns Numeric seed value
 */
function hashStringToSeed(str: string): number;
```

#### Palette

Generates deterministic color palettes from seeds.

```typescript
/**
 * Generates a complete color palette from seed
 * @param seed - String seed for deterministic generation
 * @returns Palette object with material ramps
 */
function generatePalette(seed: string): Palette;

/**
 * Converts HSL color to hex string
 * @param h - Hue (0-360)
 * @param s - Saturation (0-1)
 * @param l - Luminance (0-1)
 * @returns Hex color string (#RRGGBB)
 */
function hslToHex(h: number, s: number, l: number): string;
```

### Sprite Generation

#### Sprite Cache and Retrieval

Procedural sprite generation with caching for performance.

```typescript
/**
 * Get a specific sprite frame from cache or generate if needed
 * @param seed - Unique seed for this sprite set (e.g., "PLAYER_001", "ENEMY_HUMANOID_002")
 * @param animName - Animation name (e.g., "idle", "walk", "shoot")
 * @param frameIndex - Frame index within the animation
 * @returns The requested sprite frame
 */
function getSprite(seed: string, animName: string, frameIndex: number): SpriteFrame;

/**
 * Clear the sprite cache (useful for testing or memory management)
 */
function clearSpriteCache(): void;

/**
 * Set a custom palette (useful for testing)
 * @param palette - Palette object to use globally
 */
function setPalette(palette: Palette): void;
```

#### Animation Generation

Generate complete animation sets from seeds.

```typescript
/**
 * Generate all animations for a given seed
 * Determines entity type from seed prefix and generates appropriate animations
 * @param seed - Unique seed string
 * @returns Complete animation set for the entity
 */
function generateAllAnimations(seed: string): AnimationSet;

/**
 * Generate a complete animation sequence
 * @param animName - Name of the animation
 * @param frameCount - Number of frames in the animation
 * @param width - Width of each frame in pixels
 * @param height - Height of each frame in pixels
 * @param rng - Random number generator function
 * @param palette - Color palette to use
 * @returns Array of sprite frames
 */
function generateAnimation(
  animName: string,
  frameCount: number,
  width: number,
  height: number,
  rng: () => number,
  palette: Palette
): SpriteFrame[];

/**
 * Generate a single sprite frame using the 8-step pipeline
 * @param animName - Name of the animation
 * @param frameIndex - Index of this frame in the animation
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @param rng - Random number generator function
 * @param palette - Color palette to use
 * @returns A single sprite frame
 */
function generateFrame(
  animName: string,
  frameIndex: number,
  width: number,
  height: number,
  rng: () => number,
  palette: Palette
): SpriteFrame;
```

#### 8-Step Pipeline Functions

The sprite generation pipeline consists of 8 steps:

```typescript
/**
 * Step A: Generate a silhouette mask for the sprite
 * Creates basic shapes (capsules for humanoids, rectangles for tiles/projectiles)
 * @param animName - Animation name to determine shape
 * @param frameIndex - Frame index for animation variation
 * @param width - Sprite width
 * @param height - Sprite height
 * @param rng - Random number generator
 * @returns 2D boolean array where true = filled pixel
 */
function generateSilhouette(
  animName: string,
  frameIndex: number,
  width: number,
  height: number,
  rng: () => number
): boolean[][];

/**
 * Step B: Partition the silhouette into material regions
 * Divides the sprite into zones that will use different material colors
 * @param mask - Silhouette mask
 * @param width - Sprite width
 * @param height - Sprite height
 * @returns 2D array of region IDs (0 = empty, 1+ = material regions)
 */
function partitionRegions(
  mask: boolean[][],
  width: number,
  height: number
): number[][];

/**
 * Step C: Apply lighting with quantized color ramps
 * Maps regions to palette colors and applies lighting based on position
 * @param imageData - Image data to modify
 * @param regions - Region map
 * @param palette - Color palette
 */
function applyLighting(
  imageData: ImageData,
  regions: number[][],
  palette: Palette
): void;

/**
 * Step D: Apply 4×4 Bayer ordered dithering for texture
 * @param imageData - Image data to modify
 * @param width - Image width
 * @param height - Image height
 */
function applyDithering(
  imageData: ImageData,
  width: number,
  height: number
): void;

/**
 * Step E: Add 1-pixel outline with 2-pixel bottom weight
 * @param imageData - Image data to modify
 * @param mask - Silhouette mask
 * @param width - Image width
 * @param height - Image height
 * @param outlineColor - Hex color for outline
 */
function addOutline(
  imageData: ImageData,
  mask: boolean[][],
  width: number,
  height: number,
  outlineColor: string
): void;

/**
 * Step E: Add rim light highlights
 * @param imageData - Image data to modify
 * @param mask - Silhouette mask
 * @param width - Image width
 * @param height - Image height
 * @param palette - Color palette
 */
function addRimLight(
  imageData: ImageData,
  mask: boolean[][],
  width: number,
  height: number,
  palette: Palette
): void;

/**
 * Step F: Add micro-details for visual features
 * Adds small details like bolts, seams, vents
 * @param imageData - Image data to modify
 * @param regions - Region map
 * @param width - Image width
 * @param height - Image height
 * @param palette - Color palette
 */
function addMicroDetails(
  imageData: ImageData,
  regions: number[][],
  width: number,
  height: number,
  palette: Palette
): void;
```

#### Supported Entity Types

The sprite generator automatically determines entity type from seed prefix:

- **PLAYER_*** - Player character (24×40px): idle, walk, run, jump, fall, landRecover, roll, hang, climbUp, shoot, hurt, dead
- **ENEMY_HUMANOID_*** - Humanoid enemy (22×38px): patrol, alert, shoot, hurt, dead
- **ENEMY_DRONE_*** - Drone enemy (26×18px): patrol, alert, shoot, hurt, dead
- **PROJECTILE_*** - Projectile (6×3px): idle
- **MUZZLE_*** - Muzzle flash (10×10px): idle
- **TILE_*** - Tile (16×16px): idle

### Rendering System

#### Camera

Smooth camera system with follow, look-ahead, and bounds clamping.

```typescript
/**
 * Camera for smooth following and viewport management
 * @param target - Position to follow
 * @param bounds - Level bounds for clamping
 * @param viewportWidth - Width of viewport (384)
 * @param viewportHeight - Height of viewport (216)
 */
class Camera {
  constructor(target: Vec2, bounds: Rect, viewportWidth: number, viewportHeight: number);
  
  /**
   * Update camera position with smooth follow and look-ahead
   * @param dt - Delta time in seconds
   * @param targetVelocity - Target's velocity for look-ahead
   */
  update(dt: number, targetVelocity: Vec2): void;
  
  /**
   * Get current camera position
   */
  getPosition(): Vec2;
  
  /**
   * Set camera target position
   */
  setTarget(target: Vec2): void;
}
```

#### Renderer

Pixel-perfect rendering with offscreen buffer and aspect ratio preservation.

```typescript
/**
 * Renderer for pixel-perfect game graphics
 * @param canvas - Display canvas element
 */
class Renderer {
  constructor(canvas: HTMLCanvasElement);
  
  /**
   * Render a complete frame
   * @param camera - Camera for viewport transform
   * @param tilemap - Level tilemap to render
   * @param entities - Array of entities to render
   * @param hud - HUD data (health, ammo, etc.)
   */
  render(camera: Camera, tilemap: Tilemap, entities: Entity[], hud: HUDData): void;
  
  /**
   * Get internal buffer dimensions
   */
  getBufferSize(): { width: number; height: number };
}
```

### Level System

#### Tilemap

Level tile management with efficient lookup and animated tiles.

```typescript
/**
 * Manages the tile grid for a game level
 * @param levelData - Level data to load
 */
class Tilemap {
  constructor(levelData: LevelData);
  
  /**
   * Get tile at grid coordinates
   * @param x - X coordinate in tile grid
   * @param y - Y coordinate in tile grid
   * @returns Tile at position or null if empty/out of bounds
   */
  getTileAt(x: number, y: number): Tile | null;
  
  /**
   * Update animated tiles
   * @param dt - Delta time in seconds
   */
  update(dt: number): void;
  
  /**
   * Get level dimensions
   */
  getWidth(): number;
  getHeight(): number;
  getTileSize(): number;
}

/**
 * Load level data from JSON
 * @param json - JSON object with level data
 * @returns Parsed LevelData
 * @throws Error if JSON is invalid
 */
function loadLevelFromJSON(json: any): LevelData;
```

#### Collision Detection

AABB collision detection with axis-by-axis resolution.

```typescript
/**
 * Check collision between entity and tilemap
 * Uses axis-by-axis AABB resolution
 * @param entityBounds - Entity's bounding box in world coordinates
 * @param velocity - Entity's velocity vector
 * @param tilemap - Tilemap to check against
 * @returns Collision result with normal and penetration
 */
function checkTileCollision(
  entityBounds: Rect,
  velocity: Vec2,
  tilemap: Tilemap
): CollisionResult;

/**
 * Check collision between two entities (AABB vs AABB)
 * @param a - First entity's bounding box
 * @param b - Second entity's bounding box
 * @returns Collision result with normal and penetration
 */
function checkEntityCollision(a: Rect, b: Rect): CollisionResult;

/**
 * Check if entity overlaps with ladder tiles
 * @param entityBounds - Entity's bounding box
 * @param tilemap - Tilemap to check against
 * @returns True if overlapping a ladder
 */
function checkLadderOverlap(entityBounds: Rect, tilemap: Tilemap): boolean;

/**
 * Check if entity can grab a ledge
 * Requires near-perfect alignment (±2px tolerance)
 * @param entityBounds - Entity's bounding box
 * @param velocity - Entity's velocity
 * @param tilemap - Tilemap to check against
 * @returns Ledge grab result with position
 */
function checkLedgeGrab(
  entityBounds: Rect,
  velocity: Vec2,
  tilemap: Tilemap
): LedgeGrabResult;
```

#### Raycasting

Line-of-sight checks using DDA algorithm.

```typescript
/**
 * Raycast from start to end through tilemap
 * Uses DDA algorithm for efficient grid traversal
 * @param start - Starting position in world coordinates
 * @param end - Ending position in world coordinates
 * @param tilemap - Tilemap to raycast through
 * @returns Raycast result with hit information
 */
function raycastTiles(
  start: Vec2,
  end: Vec2,
  tilemap: Tilemap
): RaycastResult;
```

## Development Approach

This project follows spec-driven development with a requirements → design → tasks workflow:

1. **Requirements**: Detailed acceptance criteria for all features
2. **Design**: Complete architecture and implementation specifications
3. **Tasks**: Incremental coding tasks with testing integrated throughout
4. **Property-Based Testing**: Correctness guarantees through executable properties

See `.kiro/specs/cinematic-platformer/` for complete specifications.

## License

Private project - All rights reserved

## Contributing

This is a personal project and not currently accepting contributions.

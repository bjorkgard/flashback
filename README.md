# Flashback

![Tests](https://img.shields.io/badge/tests-56%20passing-brightgreen)
![Test Files](https://img.shields.io/badge/test%20files-4-blue)
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
- Property-based tests for palette generation and RNG determinism

🚧 **In Development**
- Sprite generation pipeline (8-step procedural art)
- Entity system (player, enemies, projectiles)
- Physics and collision detection
- Rendering system (canvas, camera, aspect ratio preservation)
- Game loop and input handling

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
│   │   ├── render/           # Rendering (sprites, palette, camera, renderer)
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

- 56 tests passing across 4 test files
- Comprehensive coverage of math utilities (Vec2, Rect)
- Property-based tests for RNG determinism and palette generation
- 30 correctness properties defined in design document (in progress)

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

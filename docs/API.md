# API Documentation

Complete API reference for all game modules.

## Table of Contents

- [Math Utilities](#math-utilities)
  - [Vec2](#vec2)
  - [Rect](#rect)
- [Palette Generation](#palette-generation)
  - [RNG](#rng)
  - [Palette](#palette)
- [Sprite Generation](#sprite-generation)
  - [Sprite Cache and Retrieval](#sprite-cache-and-retrieval)
  - [Animation Generation](#animation-generation)
  - [8-Step Pipeline Functions](#8-step-pipeline-functions)
  - [Supported Entity Types](#supported-entity-types)
- [Rendering System](#rendering-system)
  - [Camera](#camera)
  - [Renderer](#renderer)
- [Level System](#level-system)
  - [Tilemap](#tilemap)
  - [Collision Detection](#collision-detection)
  - [Raycasting](#raycasting)
- [Entity System](#entity-system)
  - [Entity Interface](#entity-interface)
  - [Player](#player)
  - [Enemy](#enemy)
  - [Projectile](#projectile)

## Math Utilities

### Vec2

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

### Rect

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

## Palette Generation

### RNG

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

### Palette

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

## Sprite Generation

### Sprite Cache and Retrieval

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

### Animation Generation

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

### 8-Step Pipeline Functions

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

### Supported Entity Types

The sprite generator automatically determines entity type from seed prefix:

- **PLAYER_*** - Player character (24×40px): idle, walk, run, jump, fall, landRecover, roll, hang, climbUp, shoot, hurt, dead
- **ENEMY_HUMANOID_*** - Humanoid enemy (22×38px): patrol, alert, shoot, hurt, dead
- **ENEMY_DRONE_*** - Drone enemy (26×18px): patrol, alert, shoot, hurt, dead
- **PROJECTILE_*** - Projectile (6×3px): idle
- **MUZZLE_*** - Muzzle flash (10×10px): idle
- **TILE_*** - Tile (16×16px): idle

## Rendering System

### Camera

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

### Renderer

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

## Level System

### Tilemap

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

### Collision Detection

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

### Raycasting

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

## Entity System

### Entity Interface

Base interface for all game entities.

```typescript
/**
 * Base interface for all game entities
 */
interface Entity {
  /** World position */
  pos: Vec2;
  
  /** Velocity vector */
  vel: Vec2;
  
  /** Bounding box for collision */
  bounds: Rect;
  
  /** Whether entity is active */
  active: boolean;
  
  /** Update entity logic */
  update(dt: number, input: InputState, tilemap: Tilemap, entities: Entity[]): void;
  
  /** Render entity */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void;
}
```

### Player

Player entity with physics-based movement and state machine.

```typescript
/**
 * Player entity with complete movement and combat system
 * @param x - Starting X position
 * @param y - Starting Y position
 * @param seed - Seed for procedural sprite generation
 */
class Player implements Entity {
  /** Player state machine */
  state: PlayerState; // 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'landRecover' | 'roll' | 'hang' | 'climbUp' | 'aim' | 'shoot' | 'hurt' | 'dead'
  
  /** Health points */
  health: number;
  
  /** Facing direction (-1 = left, 1 = right) */
  facing: number;
  
  /** Update player logic */
  update(dt: number, input: InputState, tilemap: Tilemap, entities: Entity[]): void;
  
  /** Take damage */
  takeDamage(amount: number): void;
  
  /** Set shoot callback */
  setShootCallback(callback: (pos: Vec2, direction: Vec2) => void): void;
  
  /** Check if invulnerable */
  isInvulnerable(): boolean;
}

/**
 * Player state types
 */
type PlayerState = 
  | 'idle' | 'walk' | 'run' 
  | 'jump' | 'fall' 
  | 'landRecover' | 'roll' 
  | 'hang' | 'climbUp' 
  | 'aim' | 'shoot' 
  | 'hurt' | 'dead';

/**
 * Input state for player control
 */
interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  shoot: boolean;
  roll: boolean;
  jumpPressed: boolean;
  shootPressed: boolean;
  rollPressed: boolean;
  upPressed: boolean;
}
```

### Enemy

Enemy entity with AI behavior and combat.

```typescript
/**
 * Enemy entity with patrol, alert, and combat AI
 * @param x - Starting X position
 * @param y - Starting Y position
 * @param type - Enemy type ('humanoid' | 'drone')
 * @param waypoints - Patrol waypoints
 * @param seed - Seed for procedural sprite generation
 */
class Enemy implements Entity {
  /** Enemy type */
  type: EnemyType; // 'humanoid' | 'drone'
  
  /** AI state machine */
  state: EnemyState; // 'patrol' | 'alert' | 'shoot' | 'hurt' | 'dead'
  
  /** Health points */
  health: number;
  
  /** Patrol waypoints */
  waypoints: Vec2[];
  
  /** Update enemy AI and physics */
  update(dt: number, input: InputState, tilemap: Tilemap, entities: Entity[]): void;
  
  /** Take damage */
  takeDamage(amount: number): void;
  
  /** Check if player is in line of sight */
  canSeePlayer(player: Player, tilemap: Tilemap): boolean;
}

/**
 * Enemy type variants
 */
type EnemyType = 'humanoid' | 'drone';

/**
 * Enemy state types
 */
type EnemyState = 'patrol' | 'alert' | 'shoot' | 'hurt' | 'dead';
```

### Projectile

Projectile entity for bullets and energy shots.

```typescript
/**
 * Projectile entity with velocity-based movement
 * @param x - Starting X position
 * @param y - Starting Y position
 * @param vx - X velocity
 * @param vy - Y velocity
 * @param owner - Owner type ('player' | 'enemy')
 * @param seed - Seed for procedural sprite generation
 */
class Projectile implements Entity {
  /** Owner type for collision filtering */
  owner: 'player' | 'enemy';
  
  /** Lifetime remaining in seconds */
  lifetime: number;
  
  /** Damage amount */
  damage: number;
  
  /** Update projectile physics */
  update(dt: number, input: InputState, tilemap: Tilemap, entities: Entity[]): void;
  
  /** Check collision with entity */
  checkCollision(entity: Entity): boolean;
}
```

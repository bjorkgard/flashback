# Design Document: Cinematic Platformer

## Overview

This design specifies a complete 2D pixel-art cinematic platformer built with React 19, TypeScript 5.9, and Vite 7. The game features:

- **Procedural Art Generation**: All sprites, tiles, and palettes generated at runtime from deterministic seeds
- **Pixel-Perfect Rendering**: 384×216 internal resolution scaled with nearest-neighbor filtering
- **Weighty Movement**: Deliberate physics with momentum, landing recovery, and committed rolls
- **Fixed Timestep Engine**: 60Hz update loop with accumulator-based rendering
- **Dual UI System**: Tailwind CSS for menus, canvas-based HUD with procedural bitmap font

The architecture separates concerns into engine systems (loop, input, time), entity logic (player, enemies, projectiles), rendering (sprites, camera, palette), and level management (tilemap, collision, raycasting).

## Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│                     React App Layer                      │
│  (StartMenu, PauseMenu, GameOver, Win - Tailwind CSS)  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Game Component                         │
│  - Manages canvas element and game lifecycle            │
│  - Handles menu state transitions                       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Game Engine Core                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Game Loop   │  │ Input System │  │ Time System  │ │
│  │  (60Hz fix)  │  │ (keyboard)   │  │ (accumulator)│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼─────────┐ ┌▼──────────────┐
│   Entities   │ │   Level    │ │   Renderer    │
│              │ │            │ │               │
│ - Player     │ │ - Tilemap  │ │ - Canvas      │
│ - Enemies    │ │ - Collision│ │ - Camera      │
│ - Projectile │ │ - Raycast  │ │ - Sprites     │
│              │ │            │ │ - Palette     │
└──────────────┘ └────────────┘ └───────┬───────┘
                                         │
                                ┌────────▼────────┐
                                │ Procedural Gen  │
                                │ - RNG (seeded)  │
                                │ - Palette Gen   │
                                │ - Sprite Gen    │
                                └─────────────────┘
```


### System Responsibilities

**Game Loop (engine/loop.ts)**
- Fixed 60Hz update with accumulator pattern
- Calls update() on all entities each fixed step
- Triggers render() with interpolation alpha
- Manages game state transitions (playing, paused, gameOver, won)

**Input System (engine/input.ts)**
- Tracks keyboard state (pressed, justPressed, justReleased)
- Samples input deterministically at each fixed timestep
- Provides query interface: isDown(key), wasPressed(key), wasReleased(key)

**Time System (engine/time.ts)**
- Manages delta time and accumulator
- Provides current time and frame count
- Handles fixed timestep calculations

**Renderer (render/renderer.ts)**
- Creates 384×216 offscreen canvas (internal buffer)
- Disables image smoothing on display canvas
- Scales internal buffer to screen with aspect ratio preservation
- Draws tiles, entities, particles, HUD
- Manages camera transform

**Camera (render/camera.ts)**
- Smooth follow with lerp (factor ~0.1)
- Look-ahead based on player velocity
- Clamps to level bounds
- Provides world-to-screen transform

**Sprite Generator (render/sprites.ts)**
- Implements 8-step procedural generation pipeline
- Caches generated sprites by seed
- Provides getSprite(seed, animName, frameIndex) interface
- Generates all animation frames on first request

**Palette Generator (render/palette.ts)**
- Generates 32-40 color palette from seed
- Returns structured palette object with named material ramps
- Implements HSL-to-hex conversion with jitter
- Enforces originality constraints

**Player Entity (entities/player.ts)**
- State machine: idle, walk, run, jump, fall, landRecover, roll, hang, climbUp, shoot, hurt, dead
- Physics: velocity, acceleration, gravity, friction
- Input handling: move, jump, roll, shoot, climb
- Animation state management
- Health and invulnerability tracking

**Enemy Entity (entities/enemy.ts)**
- Types: humanoid (patrol/shoot), drone (fly/shoot)
- AI: patrol waypoints, line-of-sight detection, shoot behavior
- Health and damage handling
- Animation state management

**Projectile Entity (entities/projectile.ts)**
- Velocity-based movement
- AABB collision with tiles and entities
- Lifetime tracking
- Owner tracking (player vs enemy)

**Tilemap (level/tilemap.ts)**
- Loads JSON level data
- Provides getTileAt(x, y) interface
- Stores tile type, position, metadata
- Manages animated tiles (hazards, checkpoints, exits)

**Collision System (level/collision.ts)**
- AABB vs tilemap collision (axis-by-axis)
- AABB vs AABB entity collision
- One-way platform logic (only collide from above)
- Ladder detection and climbing logic
- Ledge detection for hanging

**Raycast System (level/raycast.ts)**
- Tile-based line-of-sight checks
- DDA algorithm for grid traversal
- Used for enemy vision and projectile paths

## Components and Interfaces

### Core Types

```typescript
// math/vec2.ts
interface Vec2 {
  x: number;
  y: number;
}

function vec2(x: number, y: number): Vec2;
function add(a: Vec2, b: Vec2): Vec2;
function sub(a: Vec2, b: Vec2): Vec2;
function mul(v: Vec2, scalar: number): Vec2;
function length(v: Vec2): number;
function normalize(v: Vec2): Vec2;
function lerp(a: Vec2, b: Vec2, t: number): Vec2;

// math/rect.ts
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function rect(x: number, y: number, w: number, h: number): Rect;
function intersects(a: Rect, b: Rect): boolean;
function contains(r: Rect, p: Vec2): boolean;
```


### RNG and Seeding

```typescript
// render/palette.ts
function mulberry32(seed: number): () => number {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
```

### Palette Generation

```typescript
// render/palette.ts
interface PaletteRamp {
  colors: string[]; // hex colors
}

interface Palette {
  bgNight: PaletteRamp;
  metalCool: PaletteRamp;
  metalWarm: PaletteRamp;
  suitPrimary: PaletteRamp;
  suitSecondary: PaletteRamp;
  accentNeonA: PaletteRamp;
  accentNeonB: PaletteRamp;
  skin: PaletteRamp;
  energy: PaletteRamp;
  warning: PaletteRamp;
  shadowInk: PaletteRamp;
}

function generatePalette(seed: string): Palette {
  const rng = mulberry32(hashStringToSeed(seed));
  
  // Generate each ramp with jittered anchors
  // Example for bgNight:
  const baseHue = 220 + (rng() - 0.5) * 10; // ±5°
  const baseSat = 0.35 + (rng() - 0.5) * 0.08; // ±0.04
  const lumSteps = [0.10, 0.14, 0.18, 0.24];
  
  const bgNight = lumSteps.map(lum => {
    const jitteredLum = lum + (rng() - 0.5) * 0.06; // ±0.03
    return hslToHex(baseHue, baseSat, jitteredLum);
  });
  
  // Repeat for all ramps...
  // Enforce originality constraints on suitPrimary/Secondary
  
  return { bgNight, metalCool, /* ... */ };
}

function hslToHex(h: number, s: number, l: number): string {
  // Standard HSL to RGB to hex conversion
  // Clamp h to [0, 360], s and l to [0, 1]
  // Return "#RRGGBB"
}
```

### Sprite Generation Pipeline

```typescript
// render/sprites.ts
interface SpriteFrame {
  imageData: ImageData;
  width: number;
  height: number;
}

interface AnimationSet {
  [animName: string]: SpriteFrame[];
}

const spriteCache = new Map<string, AnimationSet>();

function getSprite(seed: string, animName: string, frameIndex: number): SpriteFrame {
  if (!spriteCache.has(seed)) {
    spriteCache.set(seed, generateAllAnimations(seed));
  }
  return spriteCache.get(seed)![animName][frameIndex];
}

function generateAllAnimations(seed: string): AnimationSet {
  const rng = mulberry32(hashStringToSeed(seed));
  const palette = getPalette(); // Global palette
  
  // Determine entity type from seed prefix
  const isPlayer = seed.startsWith("PLAYER");
  const isHumanoid = seed.startsWith("ENEMY_HUMANOID");
  const isDrone = seed.startsWith("ENEMY_DRONE");
  
  const animations: AnimationSet = {};
  
  if (isPlayer) {
    animations.idle = generateAnimation("idle", 4, 24, 40, rng, palette);
    animations.walk = generateAnimation("walk", 6, 24, 40, rng, palette);
    animations.run = generateAnimation("run", 6, 24, 40, rng, palette);
    // ... all player animations
  }
  
  return animations;
}

function generateAnimation(
  animName: string,
  frameCount: number,
  width: number,
  height: number,
  rng: () => number,
  palette: Palette
): SpriteFrame[] {
  const frames: SpriteFrame[] = [];
  
  for (let i = 0; i < frameCount; i++) {
    const frame = generateFrame(animName, i, width, height, rng, palette);
    frames.push(frame);
  }
  
  return frames;
}

function generateFrame(
  animName: string,
  frameIndex: number,
  width: number,
  height: number,
  rng: () => number,
  palette: Palette
): SpriteFrame {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(width, height);
  
  // Step A: Generate silhouette mask
  const mask = generateSilhouette(animName, frameIndex, width, height, rng);
  
  // Step B: Partition into material regions
  const regions = partitionRegions(mask, width, height, rng);
  
  // Step C: Apply lighting ramps (quantized)
  applyLighting(imageData, regions, palette, rng);
  
  // Step D: Apply 4×4 Bayer dithering
  applyDithering(imageData, width, height);
  
  // Step E: Add outline and rim-light
  addOutline(imageData, mask, width, height, palette.shadowInk.colors[0]);
  addRimLight(imageData, mask, width, height, palette);
  
  // Step F: Add micro-details
  addMicroDetails(imageData, regions, width, height, palette, rng);
  
  // Step G: Already handled by animName and frameIndex
  
  // Step H: Damage variants handled by separate seed
  
  ctx.putImageData(imageData, 0, 0);
  return { imageData, width, height };
}
```


### Entity System

```typescript
// entities/entity.ts
interface Entity {
  pos: Vec2;
  vel: Vec2;
  bounds: Rect; // Relative to pos
  active: boolean;
  
  update(dt: number, input: InputState, level: Tilemap): void;
  render(ctx: CanvasRenderingContext2D, camera: Camera): void;
}

// entities/player.ts
type PlayerState = 
  | "idle" | "walk" | "run" | "jump" | "fall" 
  | "landRecover" | "crouch" | "roll" | "hang" 
  | "climbUp" | "climbDown" | "aim" | "shoot" 
  | "hurt" | "dead";

interface Player extends Entity {
  state: PlayerState;
  facing: -1 | 1; // left or right
  health: number;
  maxHealth: number;
  invulnFrames: number;
  rollTimer: number;
  landRecoverTimer: number;
  shootCooldown: number;
  animTimer: number;
  animFrame: number;
  
  // Physics constants
  walkSpeed: number; // 60 px/s
  runSpeed: number; // 120 px/s
  jumpVelocity: number; // -240 px/s
  gravity: number; // 800 px/s²
  friction: number; // 0.85
  turnAccel: number; // 0.6 (slower when reversing)
  
  // State timers
  landRecoverDuration: number; // 150ms
  rollDuration: number; // 400ms
  rollIFrameDuration: number; // 280ms (70% of roll)
  shootCooldownDuration: number; // 300ms
  invulnDuration: number; // 1000ms after hit
}

// entities/enemy.ts
type EnemyType = "humanoid" | "drone";
type EnemyState = "patrol" | "alert" | "shoot" | "hurt" | "dead";

interface Enemy extends Entity {
  type: EnemyType;
  state: EnemyState;
  facing: -1 | 1;
  health: number;
  patrolWaypoints: Vec2[];
  currentWaypoint: number;
  detectionRange: number; // 200px
  shootRange: number; // 150px
  shootCooldown: number;
  animTimer: number;
  animFrame: number;
}

// entities/projectile.ts
interface Projectile extends Entity {
  owner: "player" | "enemy";
  damage: number;
  lifetime: number; // ms
  maxLifetime: number; // 2000ms
}
```

### Level and Collision

```typescript
// level/tileTypes.ts
type TileType = 
  | "empty" 
  | "solid" 
  | "oneWay" 
  | "ladder" 
  | "hazard" 
  | "checkpoint" 
  | "exit";

interface Tile {
  type: TileType;
  x: number;
  y: number;
  metadata?: {
    hazardType?: "electric" | "acid";
    checkpointId?: string;
    exitDestination?: string;
  };
}

// level/levelTypes.ts
interface LevelData {
  width: number; // in tiles
  height: number; // in tiles
  tileSize: number; // 16
  tiles: Tile[];
  playerSpawn: Vec2;
  enemies: {
    type: EnemyType;
    pos: Vec2;
    patrolWaypoints?: Vec2[];
  }[];
  bounds: Rect;
}

// level/collision.ts
interface CollisionResult {
  collided: boolean;
  normal: Vec2;
  penetration: number;
}

function checkTileCollision(
  entity: Rect,
  velocity: Vec2,
  tilemap: Tilemap
): CollisionResult {
  // Axis-by-axis AABB collision
  // 1. Move X, resolve X collisions
  // 2. Move Y, resolve Y collisions
  // Handle one-way platforms (only collide from above)
  // Return collision info
}

function checkEntityCollision(a: Rect, b: Rect): CollisionResult {
  // Simple AABB overlap test
}

function checkLadderOverlap(entity: Rect, tilemap: Tilemap): boolean {
  // Check if entity overlaps any ladder tiles
}

function checkLedgeGrab(
  entity: Rect,
  velocity: Vec2,
  tilemap: Tilemap
): { canGrab: boolean; ledgePos: Vec2 } {
  // Check for solid tile at hand level
  // Check for empty tile above
  // Require near-perfect alignment (±2px)
}

// level/raycast.ts
function raycastTiles(
  start: Vec2,
  end: Vec2,
  tilemap: Tilemap
): { hit: boolean; hitPos: Vec2; hitTile: Tile } {
  // DDA algorithm for grid traversal
  // Return first solid tile hit
}
```


### Rendering System

```typescript
// render/renderer.ts
interface RenderConfig {
  internalWidth: number; // 384
  internalHeight: number; // 216
  targetCanvas: HTMLCanvasElement;
}

class Renderer {
  private offscreenCanvas: OffscreenCanvas;
  private offscreenCtx: OffscreenCanvasRenderingContext2D;
  private displayCanvas: HTMLCanvasElement;
  private displayCtx: CanvasRenderingContext2D;
  private camera: Camera;
  private palette: Palette;
  private spriteCache: Map<string, AnimationSet>;
  
  constructor(config: RenderConfig) {
    this.offscreenCanvas = new OffscreenCanvas(config.internalWidth, config.internalHeight);
    this.offscreenCtx = this.offscreenCanvas.getContext("2d")!;
    this.displayCanvas = config.targetCanvas;
    this.displayCtx = this.displayCanvas.getContext("2d")!;
    this.displayCtx.imageSmoothingEnabled = false;
    
    this.camera = new Camera(config.internalWidth, config.internalHeight);
    this.palette = generatePalette("CINEMATIC_V1");
    this.spriteCache = new Map();
  }
  
  render(level: Tilemap, entities: Entity[], hud: HudData): void {
    // Clear internal buffer
    this.offscreenCtx.fillStyle = this.palette.bgNight.colors[0];
    this.offscreenCtx.fillRect(0, 0, 384, 216);
    
    // Apply camera transform
    this.offscreenCtx.save();
    this.offscreenCtx.translate(-this.camera.x, -this.camera.y);
    
    // Render background layer
    this.renderBackground();
    
    // Render tilemap
    this.renderTilemap(level);
    
    // Render entities (sorted by y for depth)
    const sorted = entities.slice().sort((a, b) => a.pos.y - b.pos.y);
    sorted.forEach(e => e.render(this.offscreenCtx, this.camera));
    
    this.offscreenCtx.restore();
    
    // Render HUD (no camera transform)
    this.renderHUD(hud);
    
    // Scale to display canvas
    this.scaleToDisplay();
  }
  
  private scaleToDisplay(): void {
    const displayW = this.displayCanvas.width;
    const displayH = this.displayCanvas.height;
    const aspectRatio = 16 / 9;
    
    // Calculate scale to fit while preserving aspect ratio
    let scale = Math.min(displayW / 384, displayH / 216);
    let scaledW = 384 * scale;
    let scaledH = 216 * scale;
    
    // Center with letterbox/pillarbox
    let offsetX = (displayW - scaledW) / 2;
    let offsetY = (displayH - scaledH) / 2;
    
    // Clear display canvas
    this.displayCtx.fillStyle = "#000";
    this.displayCtx.fillRect(0, 0, displayW, displayH);
    
    // Draw scaled internal buffer
    this.displayCtx.drawImage(
      this.offscreenCanvas as any,
      0, 0, 384, 216,
      offsetX, offsetY, scaledW, scaledH
    );
  }
  
  private renderTilemap(level: Tilemap): void {
    const startX = Math.floor(this.camera.x / 16);
    const startY = Math.floor(this.camera.y / 16);
    const endX = Math.ceil((this.camera.x + 384) / 16);
    const endY = Math.ceil((this.camera.y + 216) / 16);
    
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tile = level.getTileAt(x, y);
        if (tile && tile.type !== "empty") {
          this.renderTile(tile, x * 16, y * 16);
        }
      }
    }
  }
  
  private renderTile(tile: Tile, x: number, y: number): void {
    const sprite = getSprite(`TILE_${tile.type.toUpperCase()}`, "idle", 0);
    this.offscreenCtx.putImageData(sprite.imageData, x, y);
  }
  
  private renderHUD(hud: HudData): void {
    // Draw health bar
    const healthPercent = hud.health / hud.maxHealth;
    this.offscreenCtx.fillStyle = this.palette.warning.colors[0];
    this.offscreenCtx.fillRect(8, 8, 60 * healthPercent, 4);
    
    // Draw ammo/cooldown indicator
    // Draw procedural bitmap font text
  }
}

// render/camera.ts
class Camera {
  x: number = 0;
  y: number = 0;
  width: number;
  height: number;
  target: Vec2 | null = null;
  followSpeed: number = 0.1;
  lookAheadDistance: number = 40;
  bounds: Rect | null = null;
  
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  
  update(dt: number): void {
    if (!this.target) return;
    
    // Calculate desired position with look-ahead
    const targetX = this.target.x - this.width / 2;
    const targetY = this.target.y - this.height / 2;
    
    // Smooth lerp
    this.x += (targetX - this.x) * this.followSpeed;
    this.y += (targetY - this.y) * this.followSpeed;
    
    // Clamp to bounds
    if (this.bounds) {
      this.x = Math.max(this.bounds.x, Math.min(this.x, this.bounds.x + this.bounds.w - this.width));
      this.y = Math.max(this.bounds.y, Math.min(this.y, this.bounds.y + this.bounds.h - this.height));
    }
  }
  
  setTarget(target: Vec2): void {
    this.target = target;
  }
  
  setBounds(bounds: Rect): void {
    this.bounds = bounds;
  }
}
```


### Game Loop and Input

```typescript
// engine/loop.ts
interface GameState {
  mode: "menu" | "playing" | "paused" | "gameOver" | "won";
  level: Tilemap;
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  camera: Camera;
  renderer: Renderer;
  input: InputSystem;
  time: TimeSystem;
}

class GameLoop {
  private state: GameState;
  private running: boolean = false;
  private fixedDt: number = 1000 / 60; // 16.67ms
  private accumulator: number = 0;
  private lastTime: number = 0;
  
  constructor(canvas: HTMLCanvasElement, levelData: LevelData) {
    this.state = this.initializeState(canvas, levelData);
  }
  
  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }
  
  stop(): void {
    this.running = false;
  }
  
  private loop(currentTime: number): void {
    if (!this.running) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.accumulator += deltaTime;
    
    // Fixed timestep updates
    while (this.accumulator >= this.fixedDt) {
      this.fixedUpdate(this.fixedDt / 1000); // Convert to seconds
      this.accumulator -= this.fixedDt;
    }
    
    // Render with interpolation alpha
    const alpha = this.accumulator / this.fixedDt;
    this.render(alpha);
    
    requestAnimationFrame(this.loop.bind(this));
  }
  
  private fixedUpdate(dt: number): void {
    if (this.state.mode !== "playing") return;
    
    // Sample input
    this.state.input.update();
    
    // Update player
    this.state.player.update(dt, this.state.input, this.state.level);
    
    // Update enemies
    this.state.enemies.forEach(enemy => {
      enemy.update(dt, this.state.input, this.state.level);
      
      // Check line of sight to player
      if (enemy.state === "patrol") {
        const canSee = raycastTiles(
          enemy.pos,
          this.state.player.pos,
          this.state.level
        );
        if (!canSee.hit && distance(enemy.pos, this.state.player.pos) < enemy.detectionRange) {
          enemy.state = "alert";
        }
      }
    });
    
    // Update projectiles
    this.state.projectiles = this.state.projectiles.filter(p => {
      p.update(dt, this.state.input, this.state.level);
      return p.active;
    });
    
    // Check collisions
    this.checkCollisions();
    
    // Update camera
    this.state.camera.setTarget(this.state.player.pos);
    this.state.camera.update(dt);
    
    // Check win/lose conditions
    this.checkGameConditions();
  }
  
  private render(alpha: number): void {
    const entities: Entity[] = [
      this.state.player,
      ...this.state.enemies,
      ...this.state.projectiles
    ];
    
    const hudData = {
      health: this.state.player.health,
      maxHealth: this.state.player.maxHealth,
      ammo: 999, // Unlimited for now
    };
    
    this.state.renderer.render(this.state.level, entities, hudData);
  }
  
  private checkCollisions(): void {
    // Projectile vs enemies
    this.state.projectiles.forEach(proj => {
      if (proj.owner === "player") {
        this.state.enemies.forEach(enemy => {
          if (intersects(proj.bounds, enemy.bounds)) {
            enemy.health -= proj.damage;
            proj.active = false;
            if (enemy.health <= 0) {
              enemy.state = "dead";
            } else {
              enemy.state = "hurt";
            }
          }
        });
      }
    });
    
    // Projectile vs player
    this.state.projectiles.forEach(proj => {
      if (proj.owner === "enemy" && this.state.player.invulnFrames <= 0) {
        if (intersects(proj.bounds, this.state.player.bounds)) {
          // Check if player is rolling with i-frames
          if (this.state.player.state === "roll" && 
              this.state.player.rollTimer < this.state.player.rollIFrameDuration) {
            // Evaded!
            proj.active = false;
          } else {
            this.state.player.health -= proj.damage;
            this.state.player.invulnFrames = this.state.player.invulnDuration;
            this.state.player.state = "hurt";
            proj.active = false;
          }
        }
      }
    });
  }
  
  private checkGameConditions(): void {
    if (this.state.player.health <= 0) {
      this.state.mode = "gameOver";
    }
    
    // Check if player reached exit
    const playerTileX = Math.floor(this.state.player.pos.x / 16);
    const playerTileY = Math.floor(this.state.player.pos.y / 16);
    const tile = this.state.level.getTileAt(playerTileX, playerTileY);
    
    if (tile && tile.type === "exit") {
      this.state.mode = "won";
    }
  }
}

// engine/input.ts
class InputSystem {
  private keys: Map<string, boolean> = new Map();
  private prevKeys: Map<string, boolean> = new Map();
  
  constructor() {
    window.addEventListener("keydown", (e) => {
      this.keys.set(e.code, true);
    });
    
    window.addEventListener("keyup", (e) => {
      this.keys.set(e.code, false);
    });
  }
  
  update(): void {
    // Copy current state to previous
    this.prevKeys = new Map(this.keys);
  }
  
  isDown(key: string): boolean {
    return this.keys.get(key) || false;
  }
  
  wasPressed(key: string): boolean {
    return (this.keys.get(key) || false) && !(this.prevKeys.get(key) || false);
  }
  
  wasReleased(key: string): boolean {
    return !(this.keys.get(key) || false) && (this.prevKeys.get(key) || false);
  }
}
```


## Data Models

### Level Data Format

```json
{
  "width": 64,
  "height": 24,
  "tileSize": 16,
  "playerSpawn": { "x": 32, "y": 320 },
  "bounds": { "x": 0, "y": 0, "w": 1024, "h": 384 },
  "tiles": [
    { "type": "solid", "x": 0, "y": 23 },
    { "type": "solid", "x": 1, "y": 23 },
    { "type": "oneWay", "x": 10, "y": 18 },
    { "type": "ladder", "x": 15, "y": 20 },
    { "type": "ladder", "x": 15, "y": 19 },
    { "type": "hazard", "x": 25, "y": 23, "metadata": { "hazardType": "electric" } },
    { "type": "checkpoint", "x": 35, "y": 22, "metadata": { "checkpointId": "cp1" } },
    { "type": "exit", "x": 60, "y": 22, "metadata": { "exitDestination": "level2" } }
  ],
  "enemies": [
    {
      "type": "humanoid",
      "pos": { "x": 200, "y": 352 },
      "patrolWaypoints": [
        { "x": 200, "y": 352 },
        { "x": 280, "y": 352 }
      ]
    },
    {
      "type": "drone",
      "pos": { "x": 400, "y": 280 },
      "patrolWaypoints": [
        { "x": 400, "y": 280 },
        { "x": 400, "y": 200 }
      ]
    }
  ]
}
```

### Player State Machine

```
States and Transitions:

idle
  → walk (left/right input)
  → jump (jump input)
  → crouch (down input)
  → shoot (shoot input)
  → fall (no ground)

walk
  → idle (no input)
  → run (hold shift)
  → jump (jump input)
  → fall (no ground)

run
  → walk (release shift)
  → jump (jump input)
  → fall (no ground)

jump
  → fall (velocity.y > 0)
  → hang (near ledge + grab input)

fall
  → landRecover (hit ground)
  → hang (near ledge + grab input)

landRecover
  → idle (timer expires)

roll
  → idle (timer expires)

hang
  → climbUp (up input)
  → fall (release grab)

climbUp
  → idle (animation complete)

shoot
  → idle (animation complete)

hurt
  → idle (timer expires)
  → dead (health <= 0)

dead
  → (terminal state)
```

### Animation Timing Data

```typescript
interface AnimationConfig {
  frameCount: number;
  frameDuration: number; // ms
  loop: boolean;
}

const PLAYER_ANIMATIONS: Record<string, AnimationConfig> = {
  idle: { frameCount: 4, frameDuration: 180, loop: true },
  walk: { frameCount: 6, frameDuration: 90, loop: true },
  run: { frameCount: 6, frameDuration: 70, loop: true },
  jump: { frameCount: 2, frameDuration: 100, loop: false },
  fall: { frameCount: 2, frameDuration: 120, loop: true },
  landRecover: { frameCount: 2, frameDuration: 140, loop: false },
  roll: { frameCount: 8, frameDuration: 60, loop: false },
  hang: { frameCount: 2, frameDuration: 200, loop: true },
  climbUp: { frameCount: 4, frameDuration: 110, loop: false },
  shoot: { frameCount: 3, frameDuration: 70, loop: false },
  hurt: { frameCount: 2, frameDuration: 90, loop: false },
  dead: { frameCount: 1, frameDuration: 0, loop: false },
};

const ENEMY_ANIMATIONS: Record<string, AnimationConfig> = {
  patrol: { frameCount: 6, frameDuration: 110, loop: true },
  alert: { frameCount: 1, frameDuration: 0, loop: false },
  shoot: { frameCount: 3, frameDuration: 90, loop: false },
  hurt: { frameCount: 2, frameDuration: 90, loop: false },
  dead: { frameCount: 1, frameDuration: 0, loop: false },
};
```

### Physics Constants

```typescript
const PHYSICS = {
  // Player movement
  WALK_SPEED: 60, // px/s
  RUN_SPEED: 120, // px/s
  JUMP_VELOCITY: -240, // px/s (negative is up)
  GRAVITY: 800, // px/s²
  FRICTION: 0.85, // ground friction multiplier
  AIR_FRICTION: 0.98, // air resistance
  TURN_ACCEL: 0.6, // acceleration when reversing direction
  
  // Player timings
  LAND_RECOVER_DURATION: 150, // ms
  ROLL_DURATION: 400, // ms
  ROLL_IFRAME_DURATION: 280, // ms (70% of roll)
  SHOOT_COOLDOWN: 300, // ms
  INVULN_DURATION: 1000, // ms after hit
  
  // Collision
  LEDGE_GRAB_TOLERANCE: 2, // px
  ONE_WAY_THRESHOLD: 5, // px above platform to pass through
  
  // Projectiles
  PROJECTILE_SPEED: 200, // px/s
  PROJECTILE_LIFETIME: 2000, // ms
  PROJECTILE_DAMAGE: 1,
  
  // Enemy
  ENEMY_DETECTION_RANGE: 200, // px
  ENEMY_SHOOT_RANGE: 150, // px
  ENEMY_SHOOT_COOLDOWN: 1500, // ms
  ENEMY_PATROL_SPEED: 40, // px/s
};
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Rendering and Display Properties

**Property 1: Aspect Ratio Preservation**
*For any* container dimensions, the rendered game viewport should maintain exactly 16:9 aspect ratio with appropriate letterboxing or pillarboxing applied when the container aspect ratio differs from 16:9.
**Validates: Requirements 1.3, 1.4**

### Determinism Properties

**Property 2: Sprite Generation Determinism**
*For any* seed value, calling the Sprite_Generator multiple times with the same seed should produce pixel-identical sprite data for all animation frames.
**Validates: Requirements 2.3**

**Property 3: Palette Generation Determinism**
*For any* seed value, calling the Palette_Generator multiple times with the same seed should produce identical color palettes with the same hex values in the same order.
**Validates: Requirements 2.4**

### Palette Structure and Constraints

**Property 4: Complete Palette Structure**
*For any* generated palette, it should contain exactly the required material slots (bgNight with 4 colors, metalCool with 5, metalWarm with 5, suitPrimary with 4, suitSecondary with 4, accentNeonA with 3, accentNeonB with 3, skin with 3, energy with 3, warning with 3, shadowInk with 2) with total color count between 32-40.
**Validates: Requirements 3.1, 3.2**

**Property 5: Palette Jitter Bounds**
*For any* generated palette color, the HSL jitter applied should be within bounds: hue ±5°, saturation ±0.04, luminance ±0.03 from the anchor values.
**Validates: Requirements 3.3**

**Property 6: Suit Primary Originality**
*For any* generated palette, the suitPrimary hue should differ from both 210° and 15° by more than 15 degrees.
**Validates: Requirements 3.4**

**Property 7: Suit Color Separation**
*For any* generated palette, the suitSecondary hue should differ from the suitPrimary hue by at least 60 degrees.
**Validates: Requirements 3.5**

**Property 8: Quantized Luminance Ramps**
*For any* generated palette ramp, the luminance values should be quantized into 3-5 distinct steps with no smooth gradients between adjacent colors.
**Validates: Requirements 3.6**

### Sprite Dimension Properties

**Property 9: Correct Sprite Dimensions**
*For any* generated sprite, the dimensions should match the entity type: player sprites 24×40px, humanoid enemy sprites 22×38px, drone enemy sprites 26×18px, projectile sprites 6×3px, muzzle flash 10×10px, and all tile sprites 16×16px.
**Validates: Requirements 4.3, 4.4, 4.5, 4.6, 7.1**

**Property 10: Complete Animation Frame Sets**
*For any* entity type, the generated animation set should contain the correct number of frames for each animation: player idle (4), walk (6), run (6), jump (2), fall (2), landRecover (1-2), roll (6-8), hang (2), climbUp (4), shoot (2-3), hurt (2), dead (1); enemy patrol (4-6), alert (1), shoot (2-3), hurt (1-2), dead (1).
**Validates: Requirements 5.1-5.12, 6.1-6.5**

**Property 11: Non-Placeholder Sprites**
*For any* generated sprite, the pixel data should be non-uniform (not all the same color) and contain at least 10% non-transparent pixels, ensuring no placeholder rectangles or incomplete graphics.
**Validates: Requirements 16.2, 16.4**

### Player Physics Properties

**Property 12: Turn-In Deceleration**
*For any* player state where horizontal input reverses direction (velocity.x and input direction have opposite signs), the acceleration applied should be reduced by the turn acceleration factor (0.6) compared to normal acceleration.
**Validates: Requirements 8.1**

**Property 13: Landing Recovery Duration**
*For any* player landing event (transitioning from jump or fall state to ground), the player should enter landRecover state for a duration between 120-180ms.
**Validates: Requirements 8.2**

**Property 14: Landing Recovery Constraints**
*For any* player in landRecover state, jump input should be ignored and horizontal movement should be reduced, preventing immediate jump or full-speed movement.
**Validates: Requirements 8.3**

**Property 15: Roll Commitment Duration**
*For any* player roll initiation, the roll state should last between 350-450ms with no ability to cancel or transition to other states until completion.
**Validates: Requirements 8.4**

**Property 16: Roll Invulnerability Frames**
*For any* player in roll state, invulnerability should be active for the first 60-70% of the roll duration, preventing damage from enemy projectiles during this window.
**Validates: Requirements 8.5**

**Property 17: Ledge Grab Precision**
*For any* ledge grab attempt, the player's hand position should be within ±2 pixels of the platform edge for the grab to succeed; attempts outside this tolerance should fail.
**Validates: Requirements 8.6**

### Game Loop Properties

**Property 18: Deterministic Input Sampling**
*For any* game frame, input should only be sampled during fixed timestep updates (not during render calls), ensuring deterministic gameplay regardless of frame rate.
**Validates: Requirements 9.3**

### Combat System Properties

**Property 19: Projectile Creation on Shoot**
*For any* player shoot action (when not in cooldown), a new Projectile entity should be created with velocity in the aimed direction and owner set to "player".
**Validates: Requirements 10.1**

**Property 20: Shoot Cooldown Enforcement**
*For any* sequence of shoot inputs, if the time between inputs is less than the cooldown duration (300ms), the second shoot should be ignored and no projectile created.
**Validates: Requirements 10.2**

**Property 21: Projectile Collision Detection**
*For any* projectile whose AABB intersects with a tile or enemy AABB, the collision system should detect the intersection and mark the projectile as inactive.
**Validates: Requirements 10.3**

**Property 22: Hit Effects Application**
*For any* entity hit by a projectile, the entity should receive damage (health reduced), enter hurt state (or dead if health <= 0), and gain invulnerability frames preventing immediate subsequent hits.
**Validates: Requirements 10.4**

**Property 23: Roll Evasion Mechanics**
*For any* enemy projectile collision with a rolling player, if the collision occurs during the invulnerability window (first 60-70% of roll), the projectile should be marked inactive without damaging the player.
**Validates: Requirements 10.5**

### Enemy AI Properties

**Property 24: Patrol Waypoint Following**
*For any* enemy in patrol state with defined waypoints, the enemy should move toward the current waypoint and cycle to the next waypoint upon reaching it (within 5px tolerance).
**Validates: Requirements 11.1**

**Property 25: Line-of-Sight Detection**
*For any* enemy in patrol state, if the player is within detection range (200px) and the raycast from enemy to player does not hit solid tiles, the enemy should transition to alert state.
**Validates: Requirements 11.2**

**Property 26: Alert State Behavior**
*For any* enemy transitioning to alert state, the enemy should face toward the player's position (facing direction matches sign of player.x - enemy.x).
**Validates: Requirements 11.3**

**Property 27: Enemy Shooting Behavior**
*For any* alerted enemy where the player is within shoot range (150px) and shoot cooldown has expired, the enemy should fire a projectile toward the player and reset the cooldown timer.
**Validates: Requirements 11.4**

### Collision System Properties

**Property 28: Axis-by-Axis Collision Resolution**
*For any* entity-tilemap collision, resolving X-axis collisions before Y-axis collisions should produce correct sliding behavior along walls and prevent tunneling through tiles.
**Validates: Requirements 12.4**

**Property 29: Smooth Camera Follow**
*For any* camera update with a target, the camera position should interpolate toward the target position using lerp with follow speed factor (0.1), producing smooth movement without instant snapping.
**Validates: Requirements 12.5**

**Property 30: Camera Bounds Clamping**
*For any* camera position after update, if level bounds are set, the camera position should be clamped such that camera.x >= bounds.x, camera.x + camera.width <= bounds.x + bounds.w, and similarly for Y axis.
**Validates: Requirements 12.6**


## Error Handling

### Sprite Generation Errors

**Invalid Seed Handling**
- If seed is null/undefined, use default seed "DEFAULT_SPRITE"
- If seed produces invalid RNG state, log error and use fallback seed
- Never throw exceptions during sprite generation - always produce valid output

**Dimension Validation**
- Validate sprite dimensions before generation
- Clamp dimensions to reasonable bounds (min 1×1, max 256×256)
- Log warning if requested dimensions don't match entity type expectations

**Palette Access Errors**
- If palette is not initialized, generate default palette
- If requested color ramp doesn't exist, use shadowInk as fallback
- If color index out of bounds, use last color in ramp

### Collision Detection Errors

**Out-of-Bounds Tile Access**
- getTileAt(x, y) returns null for coordinates outside tilemap bounds
- Collision system treats null tiles as empty (no collision)
- Never throw exceptions for out-of-bounds access

**NaN/Infinity in Physics**
- Validate velocity and position vectors each frame
- If NaN detected, reset to zero vector
- If Infinity detected, clamp to maximum safe value (±10000)
- Log error when invalid values detected

**Stuck Entity Detection**
- If entity velocity is zero for >5 seconds while input is active, log warning
- If entity position hasn't changed for >10 seconds, attempt to respawn at last checkpoint
- Prevent infinite collision resolution loops (max 10 iterations)

### Level Loading Errors

**Invalid JSON**
- Catch JSON parse errors and show error screen with message
- Provide fallback minimal level (flat ground, player spawn, exit)
- Log detailed error information to console

**Missing Required Fields**
- Validate level data has width, height, tileSize, playerSpawn
- Use defaults if optional fields missing (empty enemies array, empty tiles array)
- Warn about missing fields but continue loading

**Invalid Tile Data**
- Skip tiles with invalid type (not in TileType enum)
- Skip tiles with invalid coordinates (negative or beyond level bounds)
- Log warning for each skipped tile

### Input Handling Errors

**Undefined Key Codes**
- Treat undefined/unknown key codes as not pressed
- Log warning on first occurrence of unknown key
- Never throw exceptions in input handlers

**Event Listener Failures**
- Wrap event listeners in try-catch
- Log errors but continue game execution
- Provide fallback keyboard-only controls if gamepad fails

### Rendering Errors

**Canvas Context Loss**
- Detect context loss via webglcontextlost event
- Attempt to restore context
- Show "Rendering Error" message if restoration fails
- Provide "Reload" button to restart game

**Image Data Errors**
- Validate ImageData dimensions before putImageData
- Catch and log putImageData exceptions
- Skip rendering problematic sprites (don't crash entire frame)

**Animation Frame Errors**
- If requested animation doesn't exist, use "idle" as fallback
- If frame index out of bounds, use modulo to wrap to valid frame
- Never return null/undefined from getSprite - always return valid frame

## Testing Strategy

### Dual Testing Approach

This project requires both **unit tests** and **property-based tests** for comprehensive coverage. They serve complementary purposes:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property tests**: Verify universal properties across randomized inputs

### Unit Testing Focus

Unit tests should focus on:

1. **Specific Examples**
   - Player spawns at correct position from level data
   - F3 key toggles debug overlay
   - Exit tile triggers win condition
   - Checkpoint saves player progress

2. **Edge Cases**
   - Empty level data (no tiles)
   - Player at exact level boundary
   - Projectile lifetime expiration
   - Enemy with no patrol waypoints

3. **Integration Points**
   - Level JSON loading and parsing
   - React component lifecycle with game loop
   - Canvas resize handling
   - Menu state transitions

4. **Error Conditions**
   - Invalid JSON level data
   - Out-of-bounds tile access
   - NaN in physics calculations
   - Missing sprite animations

### Property-Based Testing Configuration

**Library**: Use `fast-check` for TypeScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: cinematic-platformer, Property N: [property text]`
- Use custom generators for game-specific types (Vec2, Rect, Entity states)

**Property Test Implementation**:

Each correctness property from the design document should be implemented as a single property-based test. Examples:

```typescript
// Property 2: Sprite Generation Determinism
test("Feature: cinematic-platformer, Property 2: Sprite generation determinism", () => {
  fc.assert(
    fc.property(fc.string(), (seed) => {
      const sprite1 = generateAllAnimations(seed);
      const sprite2 = generateAllAnimations(seed);
      
      // Compare pixel data for all animations
      for (const animName in sprite1) {
        for (let i = 0; i < sprite1[animName].length; i++) {
          const frame1 = sprite1[animName][i].imageData.data;
          const frame2 = sprite2[animName][i].imageData.data;
          expect(frame1).toEqual(frame2);
        }
      }
    }),
    { numRuns: 100 }
  );
});

// Property 17: Ledge Grab Precision
test("Feature: cinematic-platformer, Property 17: Ledge grab precision", () => {
  fc.assert(
    fc.property(
      fc.record({
        playerX: fc.float({ min: 0, max: 1000 }),
        playerY: fc.float({ min: 0, max: 1000 }),
        ledgeX: fc.float({ min: 0, max: 1000 }),
        ledgeY: fc.float({ min: 0, max: 1000 }),
      }),
      ({ playerX, playerY, ledgeX, ledgeY }) => {
        const player = createPlayer(playerX, playerY);
        const tilemap = createTilemapWithLedge(ledgeX, ledgeY);
        
        const result = checkLedgeGrab(player.bounds, player.vel, tilemap);
        const distance = Math.abs(playerX - ledgeX);
        
        if (distance <= 2) {
          expect(result.canGrab).toBe(true);
        } else {
          expect(result.canGrab).toBe(false);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

**Custom Generators**:

```typescript
// Generator for Vec2
const vec2Gen = () => fc.record({
  x: fc.float({ min: -1000, max: 1000 }),
  y: fc.float({ min: -1000, max: 1000 }),
});

// Generator for Rect
const rectGen = () => fc.record({
  x: fc.float({ min: 0, max: 1000 }),
  y: fc.float({ min: 0, max: 1000 }),
  w: fc.float({ min: 1, max: 100 }),
  h: fc.float({ min: 1, max: 100 }),
});

// Generator for PlayerState
const playerStateGen = () => fc.constantFrom(
  "idle", "walk", "run", "jump", "fall", 
  "landRecover", "crouch", "roll", "hang", 
  "climbUp", "climbDown", "aim", "shoot", 
  "hurt", "dead"
);

// Generator for valid seeds
const seedGen = () => fc.string({ minLength: 1, maxLength: 50 });
```

### Test Organization

```
src/
  game/
    __tests__/
      engine/
        loop.test.ts
        input.test.ts
      entities/
        player.test.ts
        player.properties.test.ts  # Property-based tests
        enemy.test.ts
        enemy.properties.test.ts
      render/
        palette.test.ts
        palette.properties.test.ts
        sprites.test.ts
        sprites.properties.test.ts
        renderer.test.ts
      level/
        collision.test.ts
        collision.properties.test.ts
        raycast.test.ts
      math/
        vec2.test.ts
        rect.test.ts
  ui/
    __tests__/
      StartMenu.test.tsx
      PauseMenu.test.tsx
```

### Coverage Goals

- **Unit test coverage**: 80%+ for core game logic
- **Property test coverage**: All 30 correctness properties implemented
- **Integration tests**: Key user flows (start game, play level, win/lose)
- **Visual regression**: Manual testing for procedural art quality

### Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run only property-based tests
npm test -- properties.test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- player.test.ts
```

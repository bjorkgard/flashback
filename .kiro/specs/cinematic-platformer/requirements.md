# Requirements Document

## Introduction

This document specifies the requirements for a 2D canvas pixel-art cinematic platformer game built with React, TypeScript, and Vite. The game features procedurally generated art, weighty deliberate movement mechanics inspired by early 90s cinematic sci-fi platformers, and a complete rendering pipeline with deterministic seeded generation.

## Glossary

- **Game_Engine**: The core game loop and update system running at fixed 60Hz timestep
- **Renderer**: The canvas rendering system that draws the game at 384×216 internal resolution
- **Sprite_Generator**: The procedural system that generates pixel-art sprites from seeds
- **Palette_Generator**: The system that creates deterministic color palettes from seeds
- **RNG**: Random Number Generator - specifically the mulberry32 seeded PRNG
- **Player_Entity**: The player-controlled character with physics and animation states
- **Enemy_Entity**: AI-controlled hostile entities (humanoid and drone types)
- **Tilemap**: The level data structure containing tile types and positions
- **Collision_System**: The AABB collision detection and resolution system
- **HUD**: Heads-Up Display showing player health, ammo, and game state
- **UI_Overlay**: Tailwind-styled React components for menus and screens
- **Internal_Buffer**: The 384×216 offscreen canvas used for pixel-perfect rendering
- **Animation_Frame**: A single sprite image in an animation sequence
- **Projectile**: A bullet or energy shot fired by player or enemies
- **Checkpoint**: A save point that stores player progress
- **Hazard**: Environmental damage source (electric floor or acid)
- **Ledge_Grab**: The mechanic where player hangs from platform edges

## Requirements

### Requirement 1: Rendering Pipeline

**User Story:** As a player, I want pixel-perfect retro graphics that scale cleanly to my screen, so that the game has an authentic cinematic platformer aesthetic.

#### Acceptance Criteria

1. THE Renderer SHALL use an internal buffer of exactly 384×216 pixels (16:9 aspect ratio)
2. WHEN rendering to screen, THE Renderer SHALL disable image smoothing for nearest-neighbor scaling
3. THE Renderer SHALL maintain 16:9 aspect ratio regardless of container dimensions
4. WHEN the container aspect ratio differs from 16:9, THE Renderer SHALL apply letterboxing or pillarboxing
5. THE Renderer SHALL use an offscreen canvas as the internal buffer
6. WHEN drawing the final frame, THE Renderer SHALL copy the internal buffer to the on-screen canvas with imageSmoothingEnabled set to false

### Requirement 2: Deterministic Random Generation

**User Story:** As a developer, I want all procedural generation to be deterministic and reproducible, so that the same seed always produces identical visual results.

#### Acceptance Criteria

1. THE RNG SHALL implement the mulberry32 algorithm accepting a numeric seed
2. THE RNG SHALL implement hashStringToSeed to convert string identifiers to numeric seeds
3. WHEN given the same seed, THE Sprite_Generator SHALL produce identical sprite pixel data
4. WHEN given the same seed, THE Palette_Generator SHALL produce identical color palettes
5. THE Game_Engine SHALL use distinct seeds for player sprites, enemy sprites, tileset, and global palette

### Requirement 3: Palette Generation

**User Story:** As a player, I want a cohesive and original color palette with high contrast, so that the game has a distinct visual identity.

#### Acceptance Criteria

1. THE Palette_Generator SHALL create palettes with 32-40 colors organized into material ramps
2. THE Palette_Generator SHALL include these fixed material slots: bgNight (4), metalCool (5), metalWarm (5), suitPrimary (4), suitSecondary (4), accentNeonA (3), accentNeonB (3), skin (3), energy (3), warning (3), shadowInk (2)
3. WHEN generating colors, THE Palette_Generator SHALL apply seed-based jitter to HSL anchor values (±5° hue, ±0.04 saturation, ±0.03 luminance)
4. THE Palette_Generator SHALL ensure suitPrimary hue differs from 210° and 15° by more than 15 degrees
5. THE Palette_Generator SHALL ensure suitSecondary hue differs from suitPrimary hue by at least 60 degrees
6. THE Palette_Generator SHALL use quantized luminance steps (3-5 per ramp) without smooth gradients

### Requirement 4: Sprite Generation

**User Story:** As a player, I want all game sprites to be procedurally generated pixel art with no placeholder graphics, so that the game feels complete and polished.

#### Acceptance Criteria

1. THE Sprite_Generator SHALL generate all sprites using ImageData and offscreen canvas (no external image files)
2. THE Sprite_Generator SHALL follow an 8-step pipeline: silhouette mask, material regions, lighting ramps, dithering, outline/rim-light, micro-details, animation poses, damage variants
3. THE Sprite_Generator SHALL generate player sprites at 24×40 pixels
4. THE Sprite_Generator SHALL generate humanoid enemy sprites at 22×38 pixels
5. THE Sprite_Generator SHALL generate drone enemy sprites at 26×18 pixels
6. THE Sprite_Generator SHALL generate projectile sprites at 6×3 pixels with 10×10 muzzle flash
7. THE Sprite_Generator SHALL apply 4×4 Bayer ordered dithering for texture
8. THE Sprite_Generator SHALL add 1-pixel outlines with 2-pixel bottom weight and rim highlights

### Requirement 5: Player Animation

**User Story:** As a player, I want smooth character animations that convey weight and momentum, so that movement feels deliberate and cinematic.

#### Acceptance Criteria

1. THE Sprite_Generator SHALL generate player idle animation with 4 frames at 180ms per frame
2. THE Sprite_Generator SHALL generate player walk animation with 6 frames at 90ms per frame
3. THE Sprite_Generator SHALL generate player run animation with 6 frames at 70ms per frame
4. THE Sprite_Generator SHALL generate player jump animation with 2 frames at 100ms per frame
5. THE Sprite_Generator SHALL generate player fall animation with 2 frames at 120ms per frame
6. THE Sprite_Generator SHALL generate player landRecover animation with 1-2 frames at 140ms per frame
7. THE Sprite_Generator SHALL generate player roll animation with 6-8 frames at 60ms per frame
8. THE Sprite_Generator SHALL generate player hang animation with 2 frames at 200ms per frame
9. THE Sprite_Generator SHALL generate player climbUp animation with 4 frames at 110ms per frame
10. THE Sprite_Generator SHALL generate player shoot animation with 2-3 frames at 70ms per frame
11. THE Sprite_Generator SHALL generate player hurt animation with 2 frames at 90ms per frame
12. THE Sprite_Generator SHALL generate player dead animation with 1 frame

### Requirement 6: Enemy Animation

**User Story:** As a player, I want enemies to have distinct animations that telegraph their behavior, so that I can anticipate and react to threats.

#### Acceptance Criteria

1. THE Sprite_Generator SHALL generate enemy patrol animation with 4-6 frames at 110ms per frame
2. THE Sprite_Generator SHALL generate enemy alert animation with 1 frame
3. THE Sprite_Generator SHALL generate enemy shoot animation with 2-3 frames at 90ms per frame
4. THE Sprite_Generator SHALL generate enemy hurt animation with 1-2 frames
5. THE Sprite_Generator SHALL generate enemy dead animation with 1 frame

### Requirement 7: Tileset Generation

**User Story:** As a player, I want procedurally generated sci-fi facility tiles that create a cohesive environment, so that levels feel like real industrial spaces.

#### Acceptance Criteria

1. THE Sprite_Generator SHALL generate 16×16 pixel tiles for all tile types
2. THE Sprite_Generator SHALL generate solid tiles with metal plating, bolts, seams, and vents
3. THE Sprite_Generator SHALL generate one-way platform tiles with highlighted top edges
4. THE Sprite_Generator SHALL generate ladder tiles with rails and rungs every 3-4 pixels
5. THE Sprite_Generator SHALL generate animated hazard tiles (electric floor OR acid drip)
6. THE Sprite_Generator SHALL generate checkpoint tiles with pulsing neon beacon
7. THE Sprite_Generator SHALL generate exit tiles with animated light strip on door frame

### Requirement 8: Player Movement Physics

**User Story:** As a player, I want movement to feel weighty and deliberate with momentum, so that platforming requires careful timing and commitment.

#### Acceptance Criteria

1. WHEN the player reverses direction, THE Player_Entity SHALL apply slower turn-in acceleration
2. WHEN the player lands from a jump or fall, THE Player_Entity SHALL enter landRecover state for 120-180ms
3. WHILE in landRecover state, THE Player_Entity SHALL have reduced control and jump input locked
4. WHEN the player initiates a roll, THE Player_Entity SHALL commit to 350-450ms roll duration
5. WHILE rolling, THE Player_Entity SHALL have invulnerability frames for the first 60-70% of roll duration
6. WHEN the player attempts a ledge grab, THE Player_Entity SHALL require near-perfect alignment with platform edge
7. THE Player_Entity SHALL support these states: idle, walk, run, jump, fall, landRecover, crouch, roll, hang, climbUp, climbDown, aim, shoot, hurt, dead

### Requirement 9: Game Loop and Timing

**User Story:** As a player, I want consistent physics and timing regardless of frame rate, so that gameplay is predictable and fair.

#### Acceptance Criteria

1. THE Game_Engine SHALL update game logic at a fixed 60Hz timestep
2. THE Game_Engine SHALL use requestAnimationFrame for rendering with accumulator pattern
3. THE Game_Engine SHALL sample input deterministically at each fixed timestep
4. WHEN F3 is pressed, THE Game_Engine SHALL toggle debug overlay showing FPS, player state, position, and velocity

### Requirement 10: Combat System

**User Story:** As a player, I want responsive shooting mechanics with tactical depth, so that combat feels skill-based and rewarding.

#### Acceptance Criteria

1. WHEN the player aims and shoots, THE Player_Entity SHALL fire a Projectile in the aimed direction
2. THE Player_Entity SHALL enforce a cooldown period between shots
3. WHEN a Projectile collides with tiles or enemies, THE Collision_System SHALL detect and resolve the collision
4. WHEN an entity is hit, THE Game_Engine SHALL apply damage, trigger hit stun, and grant temporary invulnerability
5. WHEN the player rolls with correct timing, THE Player_Entity SHALL evade enemy projectiles using invulnerability frames

### Requirement 11: Enemy AI

**User Story:** As a player, I want enemies with believable patrol and combat behavior, so that encounters feel dynamic and challenging.

#### Acceptance Criteria

1. WHILE not alerted, THE Enemy_Entity SHALL patrol along a defined path
2. WHEN the player enters line-of-sight, THE Enemy_Entity SHALL detect the player using tile-based raycasting
3. WHEN alerted, THE Enemy_Entity SHALL transition to alert state and aim toward the player
4. WHEN in range and alerted, THE Enemy_Entity SHALL shoot projectiles at the player with cooldown

### Requirement 12: Level Structure and Collision

**User Story:** As a player, I want solid collision detection and level interaction, so that platforming feels precise and fair.

#### Acceptance Criteria

1. THE Tilemap SHALL load level data from JSON containing tile types and positions
2. THE Tilemap SHALL use 16×16 pixel tile size
3. THE Tilemap SHALL support tile types: solid, one-way, ladder, hazard, checkpoint, exit
4. THE Collision_System SHALL use axis-by-axis AABB collision detection and resolution
5. THE Renderer SHALL implement smooth camera follow with look-ahead
6. THE Renderer SHALL clamp camera position to level bounds

### Requirement 13: UI Architecture

**User Story:** As a player, I want clear menus and HUD that don't break immersion, so that I can focus on gameplay.

#### Acceptance Criteria

1. THE UI_Overlay SHALL use Tailwind CSS for page layout, menus, and buttons
2. THE HUD SHALL render in-canvas using procedural bitmap font (not Tailwind)
3. THE UI_Overlay SHALL display control instructions on Start and Pause screens
4. THE UI_Overlay SHALL provide StartMenu, PauseMenu, GameOver, and Win screen components

### Requirement 14: Project Configuration

**User Story:** As a developer, I want the project properly configured with Vite, React, and Tailwind, so that development and building work smoothly.

#### Acceptance Criteria

1. THE project SHALL include Tailwind configuration files (tailwind.config.*, postcss.config.*)
2. THE project SHALL include Tailwind directives in src/styles.css
3. THE project SHALL organize code into /game, /ui, and root directories
4. THE project SHALL run successfully after npm install && npm run dev

### Requirement 15: Sample Level Design

**User Story:** As a player, I want a tutorial level that teaches core mechanics progressively, so that I can learn the game naturally through play.

#### Acceptance Criteria

1. THE sample level SHALL teach walking and jumping in the first section
2. THE sample level SHALL introduce ladder climbing in the second section
3. THE sample level SHALL require a deliberate gap jump in the third section
4. THE sample level SHALL include a tight but fair ledge grab challenge
5. THE sample level SHALL include 2 enemies: one patrol humanoid and one drone shooter
6. THE sample level SHALL include at least one hazard (electric floor or acid)
7. THE sample level SHALL include a checkpoint before the final challenge
8. WHEN the player reaches the exit trigger, THE Game_Engine SHALL transition to Win screen

### Requirement 16: Originality Constraints

**User Story:** As a developer, I want all assets to be original and legally safe, so that the game can be distributed without copyright concerns.

#### Acceptance Criteria

1. THE Sprite_Generator SHALL NOT replicate copyrighted character designs, palettes, or animation frames
2. THE Sprite_Generator SHALL NOT use placeholder rectangles or incomplete graphics
3. THE Palette_Generator SHALL generate visually distinct palettes that don't match iconic game palettes
4. THE Sprite_Generator SHALL generate complete pixel-art textures for all visual elements
5. THE project SHALL be fully runnable with all visual assets generated at runtime

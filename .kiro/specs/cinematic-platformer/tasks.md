# Implementation Plan: Cinematic Platformer

## Overview

This implementation plan breaks down the cinematic platformer into incremental coding tasks. Each task builds on previous work, with testing integrated throughout. The plan follows a bottom-up approach: foundational systems first (math, RNG, palette), then rendering (sprites, canvas), then game logic (entities, physics, collision), and finally integration (game loop, UI, level).

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create directory structure: src/game/{engine,math,level,entities,render}, src/ui
  - Install dependencies: fast-check for property-based testing, @types/node
  - Configure Tailwind CSS (tailwind.config.ts, postcss.config.js)
  - Add Tailwind directives to src/index.css
  - Set up test framework configuration for Vitest
  - _Requirements: 14.1, 14.2, 14.3_

- [x] 2. Implement math utilities
  - [x] 2.1 Create Vec2 type and operations (src/game/math/vec2.ts)
    - Implement vec2(), add(), sub(), mul(), length(), normalize(), lerp()
    - _Requirements: 12.4, 12.5_
  
  - [x] 2.2 Write unit tests for Vec2 operations
    - Test basic operations with known values
    - Test edge cases (zero vectors, normalization of zero)
    - _Requirements: 12.4, 12.5_
  
  - [x] 2.3 Create Rect type and operations (src/game/math/rect.ts)
    - Implement rect(), intersects(), contains()
    - _Requirements: 10.3, 12.4_
  
  - [x] 2.4 Write unit tests for Rect operations
    - Test intersection detection with various overlaps
    - Test containment checks
    - _Requirements: 10.3, 12.4_

- [x] 3. Implement RNG and palette generation
  - [x] 3.1 Create seeded RNG (src/game/render/palette.ts)
    - Implement mulberry32(seed: number)
    - Implement hashStringToSeed(str: string)
    - _Requirements: 2.1, 2.2_
  
  - [x] 3.2 Write property test for RNG determinism
    - **Property 3: Palette Generation Determinism**
    - **Validates: Requirements 2.4**
  
  - [x] 3.3 Implement palette generation
    - Create Palette and PaletteRamp interfaces
    - Implement generatePalette(seed: string) with all material ramps
    - Implement hslToHex(h, s, l) conversion
    - Apply jitter to anchor values
    - Enforce originality constraints (suitPrimary, suitSecondary)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 3.4 Write property tests for palette generation
    - **Property 4: Complete Palette Structure**
    - **Property 5: Palette Jitter Bounds**
    - **Property 6: Suit Primary Originality**
    - **Property 7: Suit Color Separation**
    - **Property 8: Quantized Luminance Ramps**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

- [x] 4. Checkpoint - Verify palette generation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement sprite generation pipeline
  - [x] 5.1 Create sprite types and cache (src/game/render/sprites.ts)
    - Define SpriteFrame, AnimationSet interfaces
    - Create sprite cache Map
    - Implement getSprite(seed, animName, frameIndex) with caching
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 5.2 Implement silhouette and region generation
    - Implement generateSilhouette() for basic shapes (capsules, rectangles)
    - Implement partitionRegions() to divide into material zones
    - _Requirements: 4.2_
  
  - [x] 5.3 Implement lighting, dithering, and details
    - Implement applyLighting() with quantized ramps
    - Implement applyDithering() with 4×4 Bayer matrix
    - Implement addOutline() and addRimLight()
    - Implement addMicroDetails() for visual features
    - _Requirements: 4.2, 4.7, 4.8_
  
  - [x] 5.4 Implement animation frame generation
    - Implement generateFrame() combining all pipeline steps
    - Implement generateAnimation() for frame sequences
    - Implement generateAllAnimations() for complete animation sets
    - Handle player, humanoid enemy, drone enemy, projectile, and tile sprites
    - _Requirements: 4.2, 5.1-5.12, 6.1-6.5, 7.1-7.7_
  
  - [x] 5.5 Write property tests for sprite generation
    - **Property 2: Sprite Generation Determinism**
    - **Property 9: Correct Sprite Dimensions**
    - **Property 10: Complete Animation Frame Sets**
    - **Property 11: Non-Placeholder Sprites**
    - **Validates: Requirements 2.3, 4.3-4.6, 5.1-5.12, 6.1-6.5, 7.1, 16.2, 16.4**

- [ ] 6. Checkpoint - Verify sprite generation
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 7. Implement rendering system
  - [ ] 7.1 Create Camera class (src/game/render/camera.ts)
    - Implement smooth follow with lerp
    - Implement look-ahead based on target velocity
    - Implement bounds clamping
    - _Requirements: 12.5, 12.6_
  
  - [ ] 7.2 Write property tests for camera
    - **Property 29: Smooth Camera Follow**
    - **Property 30: Camera Bounds Clamping**
    - **Validates: Requirements 12.5, 12.6**
  
  - [ ] 7.3 Create Renderer class (src/game/render/renderer.ts)
    - Create offscreen canvas (384×216) and display canvas
    - Disable image smoothing on display context
    - Implement render() method: clear, apply camera transform, render tiles/entities/HUD
    - Implement scaleToDisplay() with aspect ratio preservation and letterboxing
    - Implement renderTilemap() with viewport culling
    - Implement renderHUD() with procedural bitmap font
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 13.2_
  
  - [ ] 7.4 Write property test for aspect ratio preservation
    - **Property 1: Aspect Ratio Preservation**
    - **Validates: Requirements 1.3, 1.4**
  
  - [ ] 7.5 Write unit tests for renderer
    - Test internal buffer dimensions (384×216)
    - Test imageSmoothingEnabled is false
    - Test offscreen canvas usage
    - _Requirements: 1.1, 1.2, 1.5, 1.6_

- [ ] 8. Implement level and collision systems
  - [ ] 8.1 Create tile types and level data structures (src/game/level/tileTypes.ts, levelTypes.ts)
    - Define TileType enum and Tile interface
    - Define LevelData interface
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ] 8.2 Create Tilemap class (src/game/level/tilemap.ts)
    - Implement level loading from JSON
    - Implement getTileAt(x, y) with bounds checking
    - Handle animated tiles (hazards, checkpoints, exits)
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ] 8.3 Write unit tests for tilemap
    - Test JSON loading and parsing
    - Test getTileAt with valid and out-of-bounds coordinates
    - Test tile type support
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ] 8.4 Implement collision detection (src/game/level/collision.ts)
    - Implement checkTileCollision() with axis-by-axis AABB
    - Implement checkEntityCollision() for AABB vs AABB
    - Implement checkLadderOverlap()
    - Implement checkLedgeGrab() with precision tolerance
    - Handle one-way platforms (only collide from above)
    - _Requirements: 8.6, 10.3, 12.4_
  
  - [ ] 8.5 Write property tests for collision
    - **Property 17: Ledge Grab Precision**
    - **Property 21: Projectile Collision Detection**
    - **Property 28: Axis-by-Axis Collision Resolution**
    - **Validates: Requirements 8.6, 10.3, 12.4**
  
  - [ ] 8.6 Implement raycasting (src/game/level/raycast.ts)
    - Implement raycastTiles() using DDA algorithm
    - Return first solid tile hit along ray
    - _Requirements: 11.2_
  
  - [ ] 8.7 Write unit tests for raycasting
    - Test line-of-sight with clear path
    - Test line-of-sight blocked by solid tile
    - Test edge cases (same tile, adjacent tiles)
    - _Requirements: 11.2_

- [ ] 9. Checkpoint - Verify rendering and collision
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement entity base and projectile
  - [ ] 10.1 Create Entity interface (src/game/entities/entity.ts)
    - Define Entity interface with pos, vel, bounds, active
    - Define update() and render() methods
    - _Requirements: 10.1, 10.3_
  
  - [ ] 10.2 Implement Projectile entity (src/game/entities/projectile.ts)
    - Implement velocity-based movement
    - Implement AABB collision with tiles and entities
    - Implement lifetime tracking
    - Track owner (player vs enemy)
    - _Requirements: 10.1, 10.3_
  
  - [ ] 10.3 Write property tests for projectile
    - **Property 19: Projectile Creation on Shoot**
    - **Validates: Requirements 10.1**

- [ ] 11. Implement player entity
  - [ ] 11.1 Create Player entity (src/game/entities/player.ts)
    - Define PlayerState type and state machine
    - Implement physics constants (walk/run speed, jump velocity, gravity, friction)
    - Implement state: idle, walk, run, jump, fall
    - Implement input handling for movement and jumping
    - _Requirements: 8.1, 8.7, 9.3_
  
  - [ ] 11.2 Implement player advanced movement
    - Implement landRecover state with duration and constraints
    - Implement roll state with commitment and i-frames
    - Implement hang and climbUp states
    - Implement turn-in deceleration when reversing direction
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ] 11.3 Implement player combat
    - Implement aim and shoot states
    - Implement shoot cooldown enforcement
    - Create projectiles on shoot
    - Implement health, damage, and invulnerability
    - Implement hurt and dead states
    - _Requirements: 10.1, 10.2, 10.4, 10.5_
  
  - [ ] 11.4 Write property tests for player physics
    - **Property 12: Turn-In Deceleration**
    - **Property 13: Landing Recovery Duration**
    - **Property 14: Landing Recovery Constraints**
    - **Property 15: Roll Commitment Duration**
    - **Property 16: Roll Invulnerability Frames**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
  
  - [ ] 11.5 Write property tests for player combat
    - **Property 20: Shoot Cooldown Enforcement**
    - **Property 22: Hit Effects Application**
    - **Property 23: Roll Evasion Mechanics**
    - **Validates: Requirements 10.2, 10.4, 10.5**
  
  - [ ] 11.6 Write unit tests for player
    - Test state transitions (idle→walk, jump→fall, etc.)
    - Test ledge grab alignment requirements
    - Test animation frame progression
    - _Requirements: 8.6, 8.7_

- [ ] 12. Implement enemy entities
  - [ ] 12.1 Create Enemy entity (src/game/entities/enemy.ts)
    - Define EnemyType and EnemyState types
    - Implement patrol state with waypoint following
    - Implement alert state with player facing
    - Implement shoot state with cooldown
    - Implement health and damage handling
    - Support humanoid and drone types
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 12.2 Write property tests for enemy AI
    - **Property 24: Patrol Waypoint Following**
    - **Property 25: Line-of-Sight Detection**
    - **Property 26: Alert State Behavior**
    - **Property 27: Enemy Shooting Behavior**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**
  
  - [ ] 12.3 Write unit tests for enemy
    - Test waypoint cycling
    - Test detection range boundaries
    - Test shoot range boundaries
    - _Requirements: 11.1, 11.2, 11.4_

- [ ] 13. Checkpoint - Verify entity systems
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement game loop and input
  - [ ] 14.1 Create InputSystem (src/game/engine/input.ts)
    - Track keyboard state (keys Map)
    - Implement isDown(), wasPressed(), wasReleased()
    - Update previous state each frame
    - _Requirements: 9.3_
  
  - [ ] 14.2 Write property test for input sampling
    - **Property 18: Deterministic Input Sampling**
    - **Validates: Requirements 9.3**
  
  - [ ] 14.3 Create TimeSystem (src/game/engine/time.ts)
    - Manage delta time and accumulator
    - Provide current time and frame count
    - _Requirements: 9.1_
  
  - [ ] 14.4 Create GameLoop (src/game/engine/loop.ts)
    - Implement fixed 60Hz timestep with accumulator
    - Implement fixedUpdate() for game logic
    - Implement render() with interpolation alpha
    - Implement collision checking between entities
    - Implement win/lose condition checking
    - Handle game state modes (menu, playing, paused, gameOver, won)
    - _Requirements: 9.1, 9.2, 10.3, 10.4, 15.8_
  
  - [ ] 14.5 Write unit tests for game loop
    - Test fixed timestep execution
    - Test accumulator behavior
    - Test F3 debug toggle
    - _Requirements: 9.1, 9.4_

- [ ] 15. Create sample level
  - [ ] 15.1 Design and create sample level JSON (src/game/level/sampleLevel.json)
    - Create level teaching walking/jumping (section 1)
    - Add ladder climbing section (section 2)
    - Add deliberate gap jump (section 3)
    - Add tight ledge grab challenge (section 4)
    - Place 2 enemies: patrol humanoid and drone shooter
    - Add hazard (electric floor or acid)
    - Add checkpoint before final challenge
    - Add exit trigger at end
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_
  
  - [ ] 15.2 Write unit tests for sample level
    - Test level loads successfully
    - Test all required elements present (enemies, hazard, checkpoint, exit)
    - Test player spawn position is valid
    - _Requirements: 15.1-15.8_

- [ ] 16. Implement React UI components
  - [ ] 16.1 Create StartMenu component (src/ui/StartMenu.tsx)
    - Display game title with Tailwind styling
    - Show "Start Game" button
    - Display control instructions (WASD, Space, Shift, E, F)
    - Handle start button click to begin game
    - _Requirements: 13.1, 13.3, 13.4_
  
  - [ ] 16.2 Create PauseMenu component (src/ui/PauseMenu.tsx)
    - Display "Paused" with Tailwind styling
    - Show "Resume" and "Quit" buttons
    - Display control instructions
    - Handle resume/quit actions
    - _Requirements: 13.1, 13.3, 13.4_
  
  - [ ] 16.3 Create GameOver component (src/ui/GameOver.tsx)
    - Display "Game Over" message with Tailwind styling
    - Show "Retry" and "Main Menu" buttons
    - Handle retry/menu actions
    - _Requirements: 13.1, 13.4_
  
  - [ ] 16.4 Create Win component (src/ui/Win.tsx)
    - Display "Victory!" message with Tailwind styling
    - Show "Play Again" and "Main Menu" buttons
    - Handle play again/menu actions
    - _Requirements: 13.1, 13.4_
  
  - [ ] 16.5 Write unit tests for UI components
    - Test component rendering
    - Test button click handlers
    - Test control instructions display
    - _Requirements: 13.3, 13.4_

- [ ] 17. Integrate game with React App
  - [ ] 17.1 Create Game component (src/game/game.ts)
    - Initialize renderer, camera, input, level, entities
    - Create GameLoop instance
    - Provide start(), stop(), pause(), resume() methods
    - Handle state transitions between menu/playing/paused/gameOver/won
    - _Requirements: 9.1, 9.2, 14.4_
  
  - [ ] 17.2 Update App.tsx to integrate game
    - Create canvas element with ref
    - Manage game state (menu, playing, paused, gameOver, won)
    - Render appropriate UI overlay based on state
    - Initialize game on component mount
    - Handle canvas resize with aspect ratio preservation
    - Apply Tailwind classes for layout and styling
    - _Requirements: 1.3, 1.4, 13.1, 14.4_
  
  - [ ] 17.3 Update index.css with Tailwind and game styles
    - Ensure Tailwind directives are present
    - Add styles for canvas container (centered, max-width)
    - Add styles for letterbox/pillarbox (black background)
    - _Requirements: 1.4, 14.2_
  
  - [ ] 17.4 Write integration tests
    - Test game initialization
    - Test state transitions (menu→playing→paused→playing)
    - Test win condition triggers Win screen
    - Test game over condition triggers GameOver screen
    - _Requirements: 15.8_

- [ ] 18. Final checkpoint and polish
  - [ ] 18.1 Verify all property-based tests pass
    - Run all property tests with 100+ iterations
    - Verify all 30 correctness properties are implemented
    - _Requirements: All_
  
  - [ ] 18.2 Verify project runs successfully
    - Run npm install
    - Run npm run dev
    - Test gameplay: movement, combat, enemies, win/lose
    - Verify no placeholder graphics (all procedural)
    - _Requirements: 14.4, 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [ ] 18.3 Add error handling and logging
    - Implement error handlers from design document
    - Add console logging for debugging
    - Handle edge cases gracefully
    - _Requirements: All error handling requirements_
  
  - [ ] 18.4 Manual testing and polish
    - Test on different screen sizes/aspect ratios
    - Verify pixel-perfect scaling
    - Test all player states and transitions
    - Test enemy AI behavior
    - Verify procedural art quality and originality
    - _Requirements: 1.3, 1.4, 16.1, 16.3_

- [ ] 19. Final verification
  - Ensure all tests pass, ask the user if questions arise.
  - Confirm project runs with: npm install && npm run dev
  - Verify all visual assets are procedurally generated at runtime
  - Confirm no copyrighted or placeholder assets

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: foundations → rendering → entities → integration

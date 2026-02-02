/**
 * Procedural sprite generation pipeline
 * Generates all game sprites from deterministic seeds using an 8-step pipeline
 */

import { generatePalette, mulberry32, hashStringToSeed, type Palette } from './palette';

/**
 * A single frame of sprite animation
 */
export interface SpriteFrame {
  imageData: ImageData;
  width: number;
  height: number;
}

/**
 * Complete set of animations for an entity
 * Maps animation name to array of frames
 */
export interface AnimationSet {
  [animName: string]: SpriteFrame[];
}

/**
 * Cache for generated sprites to avoid regeneration
 * Key: seed string, Value: complete animation set
 */
const spriteCache = new Map<string, AnimationSet>();

/**
 * Global palette instance (can be overridden for testing)
 */
let globalPalette: Palette | null = null;

/**
 * Initialize or get the global palette
 */
function getPalette(): Palette {
  if (!globalPalette) {
    globalPalette = generatePalette("CINEMATIC_V1");
  }
  return globalPalette;
}

/**
 * Set a custom palette (useful for testing)
 */
export function setPalette(palette: Palette): void {
  globalPalette = palette;
}

/**
 * Get a specific sprite frame from cache or generate if needed
 * 
 * @param seed - Unique seed for this sprite set (e.g., "PLAYER_001", "ENEMY_HUMANOID_002")
 * @param animName - Animation name (e.g., "idle", "walk", "shoot")
 * @param frameIndex - Frame index within the animation
 * @returns The requested sprite frame
 */
export function getSprite(seed: string, animName: string, frameIndex: number): SpriteFrame {
  // Validate inputs
  if (!seed || seed.length === 0) {
    seed = "DEFAULT_SPRITE";
  }

  // Check cache
  if (!spriteCache.has(seed)) {
    spriteCache.set(seed, generateAllAnimations(seed));
  }

  const animSet = spriteCache.get(seed)!;

  // Fallback to idle if animation doesn't exist
  if (!animSet[animName]) {
    console.warn(`Animation "${animName}" not found for seed "${seed}", using "idle"`);
    animName = "idle";
  }

  // Wrap frame index if out of bounds
  const frames = animSet[animName];
  if (frames.length === 0) {
    throw new Error(`No frames found for animation "${animName}" in seed "${seed}"`);
  }

  const wrappedIndex = frameIndex % frames.length;
  return frames[wrappedIndex];
}

/**
 * Clear the sprite cache (useful for testing or memory management)
 */
export function clearSpriteCache(): void {
  spriteCache.clear();
}

/**
 * Generate all animations for a given seed
 * Determines entity type from seed prefix and generates appropriate animations
 * 
 * @param seed - Unique seed string
 * @returns Complete animation set for the entity
 */
export function generateAllAnimations(seed: string): AnimationSet {
  const rng = mulberry32(hashStringToSeed(seed));
  const palette = getPalette();

  // Determine entity type from seed prefix
  const seedUpper = seed.toUpperCase();
  const isPlayer = seedUpper.startsWith("PLAYER");
  const isHumanoid = seedUpper.startsWith("ENEMY_HUMANOID");
  const isDrone = seedUpper.startsWith("ENEMY_DRONE");
  const isProjectile = seedUpper.startsWith("PROJECTILE");
  const isMuzzleFlash = seedUpper.startsWith("MUZZLE");
  const isTile = seedUpper.startsWith("TILE");

  const animations: AnimationSet = {};

  if (isPlayer) {
    // Player animations: 24×40 pixels
    animations.idle = generateAnimation("idle", 4, 24, 40, rng, palette);
    animations.walk = generateAnimation("walk", 6, 24, 40, rng, palette);
    animations.run = generateAnimation("run", 6, 24, 40, rng, palette);
    animations.jump = generateAnimation("jump", 2, 24, 40, rng, palette);
    animations.fall = generateAnimation("fall", 2, 24, 40, rng, palette);
    animations.landRecover = generateAnimation("landRecover", 2, 24, 40, rng, palette);
    animations.roll = generateAnimation("roll", 8, 24, 40, rng, palette);
    animations.hang = generateAnimation("hang", 2, 24, 40, rng, palette);
    animations.climbUp = generateAnimation("climbUp", 4, 24, 40, rng, palette);
    animations.shoot = generateAnimation("shoot", 3, 24, 40, rng, palette);
    animations.hurt = generateAnimation("hurt", 2, 24, 40, rng, palette);
    animations.dead = generateAnimation("dead", 1, 24, 40, rng, palette);
  } else if (isHumanoid) {
    // Humanoid enemy animations: 22×38 pixels
    animations.patrol = generateAnimation("patrol", 6, 22, 38, rng, palette);
    animations.alert = generateAnimation("alert", 1, 22, 38, rng, palette);
    animations.shoot = generateAnimation("shoot", 3, 22, 38, rng, palette);
    animations.hurt = generateAnimation("hurt", 2, 22, 38, rng, palette);
    animations.dead = generateAnimation("dead", 1, 22, 38, rng, palette);
  } else if (isDrone) {
    // Drone enemy animations: 26×18 pixels
    animations.patrol = generateAnimation("patrol", 4, 26, 18, rng, palette);
    animations.alert = generateAnimation("alert", 1, 26, 18, rng, palette);
    animations.shoot = generateAnimation("shoot", 2, 26, 18, rng, palette);
    animations.hurt = generateAnimation("hurt", 1, 26, 18, rng, palette);
    animations.dead = generateAnimation("dead", 1, 26, 18, rng, palette);
  } else if (isProjectile) {
    // Projectile: 6×3 pixels
    animations.idle = generateAnimation("idle", 1, 6, 3, rng, palette);
  } else if (isMuzzleFlash) {
    // Muzzle flash: 10×10 pixels
    animations.idle = generateAnimation("idle", 1, 10, 10, rng, palette);
  } else if (isTile) {
    // Tiles: 16×16 pixels
    animations.idle = generateAnimation("idle", 1, 16, 16, rng, palette);
  } else {
    // Default fallback: small sprite
    animations.idle = generateAnimation("idle", 1, 16, 16, rng, palette);
  }

  return animations;
}

/**
 * Generate a complete animation sequence
 * 
 * @param animName - Name of the animation
 * @param frameCount - Number of frames in the animation
 * @param width - Width of each frame in pixels
 * @param height - Height of each frame in pixels
 * @param rng - Random number generator function
 * @param palette - Color palette to use
 * @returns Array of sprite frames
 */
export function generateAnimation(
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

/**
 * Generate a single sprite frame using the 8-step pipeline
 * 
 * @param animName - Name of the animation
 * @param frameIndex - Index of this frame in the animation
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @param rng - Random number generator function
 * @param palette - Color palette to use
 * @returns A single sprite frame
 */
export function generateFrame(
  animName: string,
  frameIndex: number,
  width: number,
  height: number,
  rng: () => number,
  palette: Palette
): SpriteFrame {
  // Validate and clamp dimensions
  width = Math.max(1, Math.min(256, Math.floor(width)));
  height = Math.max(1, Math.min(256, Math.floor(height)));

  // Create offscreen canvas for rendering
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  
  if (!ctx) {
    throw new Error("Failed to get 2D context from OffscreenCanvas");
  }

  const imageData = ctx.createImageData(width, height);

  // Step A: Generate silhouette mask
  const mask = generateSilhouette(animName, frameIndex, width, height, rng);

  // Step B: Partition into material regions
  const regions = partitionRegions(mask, width, height);

  // Step C: Apply lighting ramps (quantized)
  applyLighting(imageData, regions, palette);

  // Step D: Apply 4×4 Bayer dithering
  applyDithering(imageData, width, height);

  // Step E: Add outline and rim-light
  addOutline(imageData, mask, width, height, palette.shadowInk.colors[0]);
  addRimLight(imageData, mask, width, height, palette);

  // Step F: Add micro-details
  addMicroDetails(imageData, regions, width, height, palette);

  // Put the image data on the canvas
  ctx.putImageData(imageData, 0, 0);

  return { imageData, width, height };
}

// Pipeline step implementations

/**
 * Generate a silhouette mask for the sprite
 * Creates basic shapes (capsules for humanoids, rectangles for tiles/projectiles)
 * 
 * @param _animName - Animation name to determine shape
 * @param frameIndex - Frame index for animation variation
 * @param width - Sprite width
 * @param height - Sprite height
 * @param rng - Random number generator
 * @returns 2D boolean array where true = filled pixel
 */
export function generateSilhouette(
  _animName: string,
  _frameIndex: number,
  width: number,
  height: number,
  rng: () => number
): boolean[][] {
  const mask: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));

  // Determine shape based on dimensions and animation
  const isHumanoid = height > width * 1.5; // Tall sprites are humanoids
  const isTile = width === 16 && height === 16;
  const isProjectile = width <= 10 && height <= 10;

  if (isHumanoid) {
    // Generate capsule shape for humanoid characters
    generateCapsule(mask, width, height);
  } else if (isTile) {
    // Generate filled rectangle for tiles
    generateRectangle(mask, width, height, 0, 0, width, height);
  } else if (isProjectile) {
    // Generate small ellipse or rectangle for projectiles
    generateEllipse(mask, width, height);
  } else {
    // Default: filled rectangle with some variation
    const margin = Math.floor(rng() * 2);
    generateRectangle(mask, width, height, margin, margin, width - margin * 2, height - margin * 2);
  }

  return mask;
}

/**
 * Generate a capsule (rounded rectangle) shape
 * Used for humanoid characters
 * 
 * @param mask - 2D boolean array to fill with shape
 * @param width - Sprite width
 * @param height - Sprite height
 */
function generateCapsule(
  mask: boolean[][],
  width: number,
  height: number
): void {
  const centerX = width / 2;
  
  // Body dimensions
  const bodyWidth = width * 0.65;
  const headRadius = width * 0.28;

  // Draw body (rounded rectangle)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;

      // Head (circle at top)
      const headY = height * 0.2;
      const distToHead = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - headY, 2));
      if (distToHead < headRadius) {
        mask[y][x] = true;
        continue;
      }

      // Body (capsule)
      const bodyTop = height * 0.3;
      const bodyBottom = height * 0.9;
      if (y >= bodyTop && y <= bodyBottom) {
        const bodyRadius = bodyWidth / 2;
        if (Math.abs(dx) < bodyRadius) {
          mask[y][x] = true;
        }
      }
    }
  }
}

/**
 * Generate a filled rectangle
 * 
 * @param mask - 2D boolean array to fill with shape
 * @param width - Sprite width
 * @param height - Sprite height
 * @param x - X coordinate of top-left corner
 * @param y - Y coordinate of top-left corner
 * @param w - Rectangle width
 * @param h - Rectangle height
 */
function generateRectangle(
  mask: boolean[][],
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  for (let py = Math.max(0, y); py < Math.min(height, y + h); py++) {
    for (let px = Math.max(0, x); px < Math.min(width, x + w); px++) {
      mask[py][px] = true;
    }
  }
}

/**
 * Generate an ellipse shape
 * 
 * @param mask - 2D boolean array to fill with shape
 * @param width - Sprite width
 * @param height - Sprite height
 */
function generateEllipse(
  mask: boolean[][],
  width: number,
  height: number
): void {
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width / 2;
  const radiusY = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      if (dx * dx + dy * dy <= 1) {
        mask[y][x] = true;
      }
    }
  }
}

/**
 * Partition the silhouette into material regions
 * Divides the sprite into zones that will use different material colors
 * 
 * @param mask - Silhouette mask
 * @param width - Sprite width
 * @param height - Sprite height
 * @param _rng - Random number generator (currently unused but kept for future enhancements)
 * @returns 2D array of region IDs (0 = empty, 1+ = material regions)
 */
export function partitionRegions(
  mask: boolean[][],
  width: number,
  height: number
): number[][] {
  const regions: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));

  // Determine if this is a humanoid (tall sprite)
  const isHumanoid = height > width * 1.5;

  if (isHumanoid) {
    // Partition humanoid into regions: head (skin), body (suit), limbs (suit secondary)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!mask[y][x]) continue;

        // Head region (top 25%)
        if (y < height * 0.25) {
          regions[y][x] = 1; // Skin
        }
        // Upper body (25-60%)
        else if (y < height * 0.6) {
          regions[y][x] = 2; // Suit primary
        }
        // Lower body (60-100%)
        else {
          regions[y][x] = 3; // Suit secondary
        }
      }
    }
  } else {
    // Simple partition: outer edge vs inner
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!mask[y][x]) continue;

        // Check if on edge
        const isEdge = 
          x === 0 || x === width - 1 || 
          y === 0 || y === height - 1 ||
          !mask[y - 1]?.[x] || !mask[y + 1]?.[x] ||
          !mask[y]?.[x - 1] || !mask[y]?.[x + 1];

        regions[y][x] = isEdge ? 1 : 2;
      }
    }
  }

  return regions;
}

/**
 * Apply lighting with quantized color ramps
 * Maps regions to palette colors and applies lighting based on position
 * 
 * @param imageData - Image data to modify
 * @param regions - Region map
 * @param palette - Color palette
 * @param _rng - Random number generator
 */
export function applyLighting(
  imageData: ImageData,
  regions: number[][],
  palette: Palette
): void {
  const height = regions.length;
  const width = regions[0]?.length || 0;

  // Map region IDs to palette ramps
  const regionToPalette: { [key: number]: string[] } = {
    0: [], // Empty
    1: palette.skin.colors, // Head/skin
    2: palette.suitPrimary.colors, // Primary body
    3: palette.suitSecondary.colors, // Secondary body
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const regionId = regions[y][x];
      if (regionId === 0) continue;

      const ramp = regionToPalette[regionId] || palette.metalCool.colors;
      if (ramp.length === 0) continue;

      // Calculate lighting based on vertical position (top = lighter)
      const lightFactor = 1 - (y / height) * 0.5; // 1.0 at top, 0.5 at bottom
      const colorIndex = Math.floor(lightFactor * (ramp.length - 1));
      const clampedIndex = Math.max(0, Math.min(ramp.length - 1, colorIndex));

      const color = hexToRgb(ramp[clampedIndex]);
      const pixelIndex = (y * width + x) * 4;
      imageData.data[pixelIndex] = color.r;
      imageData.data[pixelIndex + 1] = color.g;
      imageData.data[pixelIndex + 2] = color.b;
      imageData.data[pixelIndex + 3] = 255; // Fully opaque
    }
  }
}

/**
 * Convert hex color to RGB
 * 
 * @param hex - Hex color string (e.g., "#FF0000")
 * @returns RGB color object with r, g, b values (0-255)
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Apply 4×4 Bayer ordered dithering for texture
 * 
 * @param imageData - Image data to modify
 * @param width - Image width
 * @param height - Image height
 */
export function applyDithering(
  imageData: ImageData,
  width: number,
  height: number
): void {
  // 4×4 Bayer matrix (normalized to 0-1)
  const bayerMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];

  const threshold = 16;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      const alpha = imageData.data[pixelIndex + 3];
      
      if (alpha === 0) continue; // Skip transparent pixels

      const bayerValue = bayerMatrix[y % 4][x % 4];
      const ditherAmount = (bayerValue / threshold - 0.5) * 10; // ±5 intensity

      // Apply dither to RGB channels
      imageData.data[pixelIndex] = Math.max(0, Math.min(255, imageData.data[pixelIndex] + ditherAmount));
      imageData.data[pixelIndex + 1] = Math.max(0, Math.min(255, imageData.data[pixelIndex + 1] + ditherAmount));
      imageData.data[pixelIndex + 2] = Math.max(0, Math.min(255, imageData.data[pixelIndex + 2] + ditherAmount));
    }
  }
}

/**
 * Add 1-pixel outline with 2-pixel bottom weight
 * 
 * @param imageData - Image data to modify
 * @param mask - Silhouette mask
 * @param width - Image width
 * @param height - Image height
 * @param outlineColor - Hex color for outline
 */
export function addOutline(
  imageData: ImageData,
  mask: boolean[][],
  width: number,
  height: number,
  outlineColor: string
): void {
  const color = hexToRgb(outlineColor);
  const outline: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));

  // Find outline pixels (filled pixels adjacent to empty pixels)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y][x]) continue;

      // Check if adjacent to empty space
      const hasEmptyNeighbor = 
        (x === 0 || !mask[y][x - 1]) ||
        (x === width - 1 || !mask[y][x + 1]) ||
        (y === 0 || !mask[y - 1][x]) ||
        (y === height - 1 || !mask[y + 1][x]);

      if (hasEmptyNeighbor) {
        outline[y][x] = true;
      }
    }
  }

  // Apply outline color
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (outline[y][x]) {
        const pixelIndex = (y * width + x) * 4;
        imageData.data[pixelIndex] = color.r;
        imageData.data[pixelIndex + 1] = color.g;
        imageData.data[pixelIndex + 2] = color.b;
        imageData.data[pixelIndex + 3] = 255;

        // Add 2-pixel weight to bottom edge
        if (y < height - 1 && outline[y + 1][x]) {
          const bottomIndex = ((y + 1) * width + x) * 4;
          imageData.data[bottomIndex] = color.r;
          imageData.data[bottomIndex + 1] = color.g;
          imageData.data[bottomIndex + 2] = color.b;
          imageData.data[bottomIndex + 3] = 255;
        }
      }
    }
  }
}

/**
 * Add rim light highlights
 * 
 * @param imageData - Image data to modify
 * @param mask - Silhouette mask
 * @param width - Image width
 * @param height - Image height
 * @param palette - Color palette
 */
export function addRimLight(
  imageData: ImageData,
  mask: boolean[][],
  width: number,
  height: number,
  palette: Palette
): void {
  const highlightColor = hexToRgb(palette.accentNeonA.colors[2]); // Brightest neon

  // Add rim light to top-left edges
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!mask[y][x]) continue;

      // Check if this is a top or left edge
      const isTopEdge = !mask[y - 1][x];
      const isLeftEdge = !mask[y][x - 1];

      if (isTopEdge || isLeftEdge) {
        const pixelIndex = (y * width + x) * 4;
        // Blend highlight with existing color
        imageData.data[pixelIndex] = Math.min(255, imageData.data[pixelIndex] + highlightColor.r * 0.3);
        imageData.data[pixelIndex + 1] = Math.min(255, imageData.data[pixelIndex + 1] + highlightColor.g * 0.3);
        imageData.data[pixelIndex + 2] = Math.min(255, imageData.data[pixelIndex + 2] + highlightColor.b * 0.3);
      }
    }
  }
}

/**
 * Add micro-details for visual features
 * Adds small details like bolts, seams, vents
 * 
 * @param imageData - Image data to modify
 * @param regions - Region map
 * @param width - Image width
 * @param height - Image height
 * @param palette - Color palette
 * @param _rng - Random number generator (currently unused but kept for future enhancements)
 */
export function addMicroDetails(
  imageData: ImageData,
  regions: number[][],
  width: number,
  height: number,
  palette: Palette
): void {
  const detailColor = hexToRgb(palette.shadowInk.colors[1]);

  // Add detail pixels at regular intervals (deterministic pattern)
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      if (regions[y]?.[x] > 0) {
        const pixelIndex = (y * width + x) * 4;
        imageData.data[pixelIndex] = detailColor.r;
        imageData.data[pixelIndex + 1] = detailColor.g;
        imageData.data[pixelIndex + 2] = detailColor.b;
        imageData.data[pixelIndex + 3] = 255;
      }
    }
  }
}

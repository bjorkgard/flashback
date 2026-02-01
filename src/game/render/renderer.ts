/**
 * Renderer system for pixel-perfect canvas rendering
 * 
 * Features:
 * - 384×216 internal resolution with offscreen canvas
 * - Nearest-neighbor scaling with aspect ratio preservation
 * - Letterboxing/pillarboxing for non-16:9 displays
 * - Viewport culling for efficient tilemap rendering
 * - Procedural bitmap font for HUD
 */

import { Camera } from './camera';
import { generatePalette, type Palette } from './palette';
import { getSprite, type AnimationSet } from './sprites';

/**
 * Configuration for the renderer
 */
export interface RenderConfig {
  /** Internal rendering width (384px for 16:9 at low-res) */
  internalWidth: number;
  /** Internal rendering height (216px for 16:9 at low-res) */
  internalHeight: number;
  /** Target canvas element to render to */
  targetCanvas: HTMLCanvasElement;
}

/**
 * HUD data to display
 */
export interface HudData {
  health: number;
  maxHealth: number;
  ammo: number;
}

/**
 * Minimal entity interface for rendering
 */
export interface RenderableEntity {
  pos: { x: number; y: number };
  bounds: { x: number; y: number; w: number; h: number };
  active: boolean;
}

/**
 * Minimal tile interface for rendering
 */
export interface RenderableTile {
  type: string;
  x: number;
  y: number;
}

/**
 * Minimal tilemap interface for rendering
 */
export interface RenderableTilemap {
  getTileAt(x: number, y: number): RenderableTile | null;
  width: number;
  height: number;
  tileSize: number;
}

/**
 * Renderer class for pixel-perfect canvas rendering
 */
export class Renderer {
  private offscreenCanvas: OffscreenCanvas;
  private offscreenCtx: OffscreenCanvasRenderingContext2D;
  private displayCanvas: HTMLCanvasElement;
  private displayCtx: CanvasRenderingContext2D;
  private camera: Camera;
  private palette: Palette;
  
  readonly internalWidth: number;
  readonly internalHeight: number;

  /**
   * Create a new Renderer
   * @param config - Renderer configuration
   */
  constructor(config: RenderConfig) {
    this.internalWidth = config.internalWidth;
    this.internalHeight = config.internalHeight;

    // Create offscreen canvas for internal rendering
    this.offscreenCanvas = new OffscreenCanvas(config.internalWidth, config.internalHeight);
    const offscreenCtx = this.offscreenCanvas.getContext("2d");
    if (!offscreenCtx) {
      throw new Error("Failed to get 2D context from OffscreenCanvas");
    }
    this.offscreenCtx = offscreenCtx;

    // Set up display canvas
    this.displayCanvas = config.targetCanvas;
    const displayCtx = this.displayCanvas.getContext("2d");
    if (!displayCtx) {
      throw new Error("Failed to get 2D context from display canvas");
    }
    this.displayCtx = displayCtx;
    
    // Disable image smoothing for pixel-perfect scaling
    this.displayCtx.imageSmoothingEnabled = false;

    // Initialize camera
    this.camera = new Camera(config.internalWidth, config.internalHeight);

    // Generate palette
    this.palette = generatePalette("CINEMATIC_V1");
  }

  /**
   * Get the camera instance
   */
  getCamera(): Camera {
    return this.camera;
  }

  /**
   * Get the palette instance
   */
  getPalette(): Palette {
    return this.palette;
  }

  /**
   * Main render method
   * @param level - Tilemap to render
   * @param entities - Entities to render
   * @param hud - HUD data to display
   */
  render(
    level: RenderableTilemap | null,
    entities: RenderableEntity[],
    hud: HudData
  ): void {
    // Clear internal buffer
    this.offscreenCtx.fillStyle = this.palette.bgNight.colors[0];
    this.offscreenCtx.fillRect(0, 0, this.internalWidth, this.internalHeight);

    // Apply camera transform
    this.offscreenCtx.save();
    this.offscreenCtx.translate(-this.camera.x, -this.camera.y);

    // Render background layer (parallax could be added here)
    this.renderBackground();

    // Render tilemap
    if (level) {
      this.renderTilemap(level);
    }

    // Render entities (sorted by y for depth)
    const sorted = entities.slice().sort((a, b) => a.pos.y - b.pos.y);
    sorted.forEach(entity => {
      if (entity.active) {
        this.renderEntity(entity);
      }
    });

    this.offscreenCtx.restore();

    // Render HUD (no camera transform)
    this.renderHUD(hud);

    // Scale to display canvas
    this.scaleToDisplay();
  }

  /**
   * Render background layer
   * Currently renders a simple gradient, could be enhanced with parallax
   */
  private renderBackground(): void {
    // Background is already cleared with bgNight color
    // Could add stars, parallax layers, etc. here
  }

  /**
   * Render tilemap with viewport culling
   * @param level - Tilemap to render
   */
  private renderTilemap(level: RenderableTilemap): void {
    const tileSize = level.tileSize;
    
    // Calculate visible tile range with 1-tile padding
    const startX = Math.max(0, Math.floor(this.camera.x / tileSize) - 1);
    const startY = Math.max(0, Math.floor(this.camera.y / tileSize) - 1);
    const endX = Math.min(level.width, Math.ceil((this.camera.x + this.internalWidth) / tileSize) + 1);
    const endY = Math.min(level.height, Math.ceil((this.camera.y + this.internalHeight) / tileSize) + 1);

    // Render visible tiles
    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        const tile = level.getTileAt(tx, ty);
        if (tile && tile.type !== "empty") {
          this.renderTile(tile, tx * tileSize, ty * tileSize);
        }
      }
    }
  }

  /**
   * Render a single tile
   * @param tile - Tile to render
   * @param x - World X position
   * @param y - World Y position
   */
  private renderTile(tile: RenderableTile, x: number, y: number): void {
    try {
      const sprite = getSprite(`TILE_${tile.type.toUpperCase()}`, "idle", 0);
      this.offscreenCtx.putImageData(sprite.imageData, x, y);
    } catch (error) {
      // Fallback: render a colored rectangle if sprite generation fails
      this.offscreenCtx.fillStyle = this.palette.metalCool.colors[2];
      this.offscreenCtx.fillRect(x, y, 16, 16);
    }
  }

  /**
   * Render an entity
   * @param entity - Entity to render
   */
  private renderEntity(entity: RenderableEntity): void {
    // For now, render a simple colored rectangle
    // This will be enhanced when entity types are implemented
    this.offscreenCtx.fillStyle = this.palette.suitPrimary.colors[2];
    this.offscreenCtx.fillRect(
      entity.pos.x + entity.bounds.x,
      entity.pos.y + entity.bounds.y,
      entity.bounds.w,
      entity.bounds.h
    );
  }

  /**
   * Render HUD with procedural bitmap font
   * @param hud - HUD data to display
   */
  private renderHUD(hud: HudData): void {
    // Health bar
    const healthPercent = hud.health / hud.maxHealth;
    const healthBarWidth = 60;
    const healthBarHeight = 4;
    const healthBarX = 8;
    const healthBarY = 8;

    // Background
    this.offscreenCtx.fillStyle = this.palette.shadowInk.colors[0];
    this.offscreenCtx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Foreground
    this.offscreenCtx.fillStyle = this.palette.warning.colors[1];
    this.offscreenCtx.fillRect(
      healthBarX,
      healthBarY,
      healthBarWidth * healthPercent,
      healthBarHeight
    );

    // Ammo counter (simple text for now)
    this.renderBitmapText(`AMMO: ${hud.ammo}`, 8, 16, this.palette.accentNeonA.colors[2]);
  }

  /**
   * Render text using procedural bitmap font
   * @param text - Text to render
   * @param x - X position
   * @param y - Y position
   * @param color - Hex color string
   */
  private renderBitmapText(text: string, x: number, y: number, color: string): void {
    const charWidth = 4;
    const charHeight = 6;
    const spacing = 1;

    // Convert hex to RGB
    const rgb = this.hexToRgb(color);
    this.offscreenCtx.fillStyle = color;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charX = x + i * (charWidth + spacing);

      // Render character using simple pixel patterns
      this.renderBitmapChar(char, charX, y, charWidth, charHeight);
    }
  }

  /**
   * Render a single character using bitmap patterns
   * @param char - Character to render
   * @param x - X position
   * @param y - Y position
   * @param w - Character width
   * @param h - Character height
   */
  private renderBitmapChar(char: string, x: number, y: number, w: number, h: number): void {
    // Simple 4×6 bitmap font patterns
    // For now, just render a filled rectangle for all characters
    // This can be enhanced with actual character patterns later
    if (char !== ' ') {
      this.offscreenCtx.fillRect(x, y, w, h);
    }
  }

  /**
   * Convert hex color to RGB
   * @param hex - Hex color string
   * @returns RGB object
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Scale internal buffer to display canvas with aspect ratio preservation
   */
  private scaleToDisplay(): void {
    const displayW = this.displayCanvas.width;
    const displayH = this.displayCanvas.height;
    const aspectRatio = this.internalWidth / this.internalHeight; // 16:9

    // Calculate scale to fit while preserving aspect ratio
    let scale = Math.min(displayW / this.internalWidth, displayH / this.internalHeight);
    let scaledW = this.internalWidth * scale;
    let scaledH = this.internalHeight * scale;

    // Center with letterbox/pillarbox
    let offsetX = (displayW - scaledW) / 2;
    let offsetY = (displayH - scaledH) / 2;

    // Clear display canvas (black bars for letterbox/pillarbox)
    this.displayCtx.fillStyle = "#000";
    this.displayCtx.fillRect(0, 0, displayW, displayH);

    // Draw scaled internal buffer
    this.displayCtx.drawImage(
      this.offscreenCanvas as unknown as CanvasImageSource,
      0, 0, this.internalWidth, this.internalHeight,
      offsetX, offsetY, scaledW, scaledH
    );
  }

  /**
   * Update display canvas size (call when window resizes)
   * @param width - New canvas width
   * @param height - New canvas height
   */
  updateDisplaySize(width: number, height: number): void {
    this.displayCanvas.width = width;
    this.displayCanvas.height = height;
    // Re-disable image smoothing after canvas resize
    this.displayCtx.imageSmoothingEnabled = false;
  }
}

/**
 * Camera system for smooth following and viewport management
 * 
 * Features:
 * - Smooth lerp-based following
 * - Look-ahead based on target velocity
 * - Bounds clamping to level boundaries
 */

import type { Vec2 } from '../math/vec2';
import type { Rect } from '../math/rect';

/**
 * Camera class for viewport management and smooth following
 */
export class Camera {
  /** Camera position (top-left corner of viewport) */
  x: number = 0;
  y: number = 0;

  /** Viewport dimensions */
  width: number;
  height: number;

  /** Target to follow (typically player position) */
  target: Vec2 | null = null;

  /** Target velocity for look-ahead (optional) */
  targetVelocity: Vec2 | null = null;

  /** Smooth follow speed (0-1, lower = smoother) */
  followSpeed: number = 0.1;

  /** Look-ahead distance multiplier */
  lookAheadDistance: number = 40;

  /** Level bounds for clamping (optional) */
  bounds: Rect | null = null;

  /**
   * Create a new Camera
   * @param width - Viewport width in pixels
   * @param height - Viewport height in pixels
   */
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Update camera position with smooth following
   * @param dt - Delta time in seconds (unused but kept for consistency)
   */
  update(dt: number): void {
    if (!this.target) return;

    // Calculate desired position (center target in viewport)
    let targetX = this.target.x - this.width / 2;
    let targetY = this.target.y - this.height / 2;

    // Apply look-ahead based on target velocity
    if (this.targetVelocity) {
      targetX += this.targetVelocity.x * this.lookAheadDistance / 60; // Normalize for 60fps
      targetY += this.targetVelocity.y * this.lookAheadDistance / 60;
    }

    // Smooth lerp toward target position
    this.x += (targetX - this.x) * this.followSpeed;
    this.y += (targetY - this.y) * this.followSpeed;

    // Clamp to bounds if set
    if (this.bounds) {
      this.x = Math.max(
        this.bounds.x,
        Math.min(this.x, this.bounds.x + this.bounds.w - this.width)
      );
      this.y = Math.max(
        this.bounds.y,
        Math.min(this.y, this.bounds.y + this.bounds.h - this.height)
      );
    }
  }

  /**
   * Set the target position to follow
   * @param target - Target position (typically player position)
   */
  setTarget(target: Vec2): void {
    this.target = target;
  }

  /**
   * Set the target velocity for look-ahead
   * @param velocity - Target velocity vector
   */
  setTargetVelocity(velocity: Vec2): void {
    this.targetVelocity = velocity;
  }

  /**
   * Set level bounds for camera clamping
   * @param bounds - Level boundaries
   */
  setBounds(bounds: Rect): void {
    this.bounds = bounds;
  }

  /**
   * Clear the follow target
   */
  clearTarget(): void {
    this.target = null;
    this.targetVelocity = null;
  }
}

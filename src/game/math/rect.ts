// Rect type and operations for AABB collision detection

import type { Vec2 } from './vec2';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Create a new Rect
 */
export function rect(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h };
}

/**
 * Check if two rectangles intersect (AABB collision)
 */
export function intersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Check if a rectangle contains a point
 */
export function contains(r: Rect, p: Vec2): boolean {
  return (
    p.x >= r.x &&
    p.x <= r.x + r.w &&
    p.y >= r.y &&
    p.y <= r.y + r.h
  );
}

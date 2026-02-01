// Vec2 type and operations for 2D vector math

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Create a new Vec2
 */
export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

/**
 * Add two vectors
 */
export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract vector b from vector a
 */
export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Multiply vector by scalar
 */
export function mul(v: Vec2, scalar: number): Vec2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

/**
 * Calculate length (magnitude) of vector
 */
export function length(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Normalize vector to unit length
 * Returns zero vector if input is zero vector
 */
export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len === 0) {
    return { x: 0, y: 0 };
  }
  return { x: v.x / len, y: v.y / len };
}

/**
 * Linear interpolation between two vectors
 * @param t - Interpolation factor (0 = a, 1 = b)
 */
export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

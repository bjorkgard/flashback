import { describe, it, expect } from 'vitest';
import { vec2, add, sub, mul, length, normalize, lerp } from './vec2';

describe('Vec2 operations', () => {
  describe('vec2', () => {
    it('should create a vector with given x and y', () => {
      const v = vec2(3, 4);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });
  });

  describe('add', () => {
    it('should add two vectors', () => {
      const a = vec2(1, 2);
      const b = vec2(3, 4);
      const result = add(a, b);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('should handle negative values', () => {
      const a = vec2(-1, -2);
      const b = vec2(3, 4);
      const result = add(a, b);
      expect(result.x).toBe(2);
      expect(result.y).toBe(2);
    });
  });

  describe('sub', () => {
    it('should subtract vector b from vector a', () => {
      const a = vec2(5, 7);
      const b = vec2(2, 3);
      const result = sub(a, b);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('should handle negative results', () => {
      const a = vec2(1, 2);
      const b = vec2(3, 4);
      const result = sub(a, b);
      expect(result.x).toBe(-2);
      expect(result.y).toBe(-2);
    });
  });

  describe('mul', () => {
    it('should multiply vector by scalar', () => {
      const v = vec2(2, 3);
      const result = mul(v, 3);
      expect(result.x).toBe(6);
      expect(result.y).toBe(9);
    });

    it('should handle negative scalar', () => {
      const v = vec2(2, 3);
      const result = mul(v, -2);
      expect(result.x).toBe(-4);
      expect(result.y).toBe(-6);
    });

    it('should handle zero scalar', () => {
      const v = vec2(5, 7);
      const result = mul(v, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('length', () => {
    it('should calculate length of vector', () => {
      const v = vec2(3, 4);
      expect(length(v)).toBe(5);
    });

    it('should return 0 for zero vector', () => {
      const v = vec2(0, 0);
      expect(length(v)).toBe(0);
    });

    it('should handle negative components', () => {
      const v = vec2(-3, -4);
      expect(length(v)).toBe(5);
    });
  });

  describe('normalize', () => {
    it('should normalize vector to unit length', () => {
      const v = vec2(3, 4);
      const result = normalize(v);
      expect(result.x).toBeCloseTo(0.6);
      expect(result.y).toBeCloseTo(0.8);
      expect(length(result)).toBeCloseTo(1);
    });

    it('should return zero vector when normalizing zero vector', () => {
      const v = vec2(0, 0);
      const result = normalize(v);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should handle already normalized vectors', () => {
      const v = vec2(1, 0);
      const result = normalize(v);
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(0);
    });
  });

  describe('lerp', () => {
    it('should interpolate between two vectors at t=0', () => {
      const a = vec2(0, 0);
      const b = vec2(10, 10);
      const result = lerp(a, b, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should interpolate between two vectors at t=1', () => {
      const a = vec2(0, 0);
      const b = vec2(10, 10);
      const result = lerp(a, b, 1);
      expect(result.x).toBe(10);
      expect(result.y).toBe(10);
    });

    it('should interpolate between two vectors at t=0.5', () => {
      const a = vec2(0, 0);
      const b = vec2(10, 20);
      const result = lerp(a, b, 0.5);
      expect(result.x).toBe(5);
      expect(result.y).toBe(10);
    });

    it('should handle arbitrary t values', () => {
      const a = vec2(2, 4);
      const b = vec2(8, 10);
      const result = lerp(a, b, 0.25);
      expect(result.x).toBeCloseTo(3.5);
      expect(result.y).toBeCloseTo(5.5);
    });
  });
});

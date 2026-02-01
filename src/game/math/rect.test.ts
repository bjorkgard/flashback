import { describe, it, expect } from 'vitest';
import { rect, intersects, contains } from './rect';
import { vec2 } from './vec2';

describe('Rect operations', () => {
  describe('rect', () => {
    it('should create a rectangle with given x, y, w, h', () => {
      const r = rect(10, 20, 30, 40);
      expect(r.x).toBe(10);
      expect(r.y).toBe(20);
      expect(r.w).toBe(30);
      expect(r.h).toBe(40);
    });
  });

  describe('intersects', () => {
    it('should detect intersection when rectangles overlap', () => {
      const a = rect(0, 0, 10, 10);
      const b = rect(5, 5, 10, 10);
      expect(intersects(a, b)).toBe(true);
    });

    it('should detect no intersection when rectangles are separate', () => {
      const a = rect(0, 0, 10, 10);
      const b = rect(20, 20, 10, 10);
      expect(intersects(a, b)).toBe(false);
    });

    it('should detect intersection when one rectangle is inside another', () => {
      const a = rect(0, 0, 100, 100);
      const b = rect(25, 25, 10, 10);
      expect(intersects(a, b)).toBe(true);
    });

    it('should detect no intersection when rectangles touch edges', () => {
      const a = rect(0, 0, 10, 10);
      const b = rect(10, 0, 10, 10);
      expect(intersects(a, b)).toBe(false);
    });

    it('should detect intersection with partial horizontal overlap', () => {
      const a = rect(0, 0, 20, 10);
      const b = rect(10, 5, 20, 10);
      expect(intersects(a, b)).toBe(true);
    });

    it('should detect intersection with partial vertical overlap', () => {
      const a = rect(0, 0, 10, 20);
      const b = rect(5, 10, 10, 20);
      expect(intersects(a, b)).toBe(true);
    });

    it('should detect no intersection when rectangles are adjacent vertically', () => {
      const a = rect(0, 0, 10, 10);
      const b = rect(0, 10, 10, 10);
      expect(intersects(a, b)).toBe(false);
    });

    it('should handle rectangles with negative coordinates', () => {
      const a = rect(-10, -10, 20, 20);
      const b = rect(-5, -5, 10, 10);
      expect(intersects(a, b)).toBe(true);
    });
  });

  describe('contains', () => {
    it('should detect point inside rectangle', () => {
      const r = rect(0, 0, 10, 10);
      const p = vec2(5, 5);
      expect(contains(r, p)).toBe(true);
    });

    it('should detect point outside rectangle', () => {
      const r = rect(0, 0, 10, 10);
      const p = vec2(15, 15);
      expect(contains(r, p)).toBe(false);
    });

    it('should detect point on rectangle edge (left)', () => {
      const r = rect(0, 0, 10, 10);
      const p = vec2(0, 5);
      expect(contains(r, p)).toBe(true);
    });

    it('should detect point on rectangle edge (right)', () => {
      const r = rect(0, 0, 10, 10);
      const p = vec2(10, 5);
      expect(contains(r, p)).toBe(true);
    });

    it('should detect point on rectangle edge (top)', () => {
      const r = rect(0, 0, 10, 10);
      const p = vec2(5, 0);
      expect(contains(r, p)).toBe(true);
    });

    it('should detect point on rectangle edge (bottom)', () => {
      const r = rect(0, 0, 10, 10);
      const p = vec2(5, 10);
      expect(contains(r, p)).toBe(true);
    });

    it('should detect point at rectangle corner', () => {
      const r = rect(0, 0, 10, 10);
      const p = vec2(0, 0);
      expect(contains(r, p)).toBe(true);
    });

    it('should handle rectangles with negative coordinates', () => {
      const r = rect(-10, -10, 20, 20);
      const p = vec2(-5, -5);
      expect(contains(r, p)).toBe(true);
    });

    it('should detect point outside rectangle with negative coordinates', () => {
      const r = rect(-10, -10, 20, 20);
      const p = vec2(15, 15);
      expect(contains(r, p)).toBe(false);
    });
  });
});

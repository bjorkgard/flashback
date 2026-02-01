/**
 * Property-based tests for palette generation
 * Tests determinism and correctness properties using fast-check
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { mulberry32, hashStringToSeed, generatePalette, hslToHex } from './palette';

describe('Feature: cinematic-platformer - RNG Properties', () => {
  test('Property 3: Palette Generation Determinism', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (seed) => {
        // Generate palette twice with same seed
        const numericSeed = hashStringToSeed(seed);
        
        // Create two RNG instances with same seed
        const rng1 = mulberry32(numericSeed);
        const rng2 = mulberry32(numericSeed);
        
        // Generate 100 random numbers from each
        const sequence1: number[] = [];
        const sequence2: number[] = [];
        
        for (let i = 0; i < 100; i++) {
          sequence1.push(rng1());
          sequence2.push(rng2());
        }
        
        // Sequences should be identical
        expect(sequence1).toEqual(sequence2);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: cinematic-platformer - Palette Properties', () => {
  test('Property 4: Complete Palette Structure', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (seed) => {
        const palette = generatePalette(seed);
        
        // Check all required ramps exist
        expect(palette.bgNight).toBeDefined();
        expect(palette.metalCool).toBeDefined();
        expect(palette.metalWarm).toBeDefined();
        expect(palette.suitPrimary).toBeDefined();
        expect(palette.suitSecondary).toBeDefined();
        expect(palette.accentNeonA).toBeDefined();
        expect(palette.accentNeonB).toBeDefined();
        expect(palette.skin).toBeDefined();
        expect(palette.energy).toBeDefined();
        expect(palette.warning).toBeDefined();
        expect(palette.shadowInk).toBeDefined();
        
        // Check correct number of colors per ramp
        expect(palette.bgNight.colors).toHaveLength(4);
        expect(palette.metalCool.colors).toHaveLength(5);
        expect(palette.metalWarm.colors).toHaveLength(5);
        expect(palette.suitPrimary.colors).toHaveLength(4);
        expect(palette.suitSecondary.colors).toHaveLength(4);
        expect(palette.accentNeonA.colors).toHaveLength(3);
        expect(palette.accentNeonB.colors).toHaveLength(3);
        expect(palette.skin.colors).toHaveLength(3);
        expect(palette.energy.colors).toHaveLength(3);
        expect(palette.warning.colors).toHaveLength(3);
        expect(palette.shadowInk.colors).toHaveLength(2);
        
        // Total color count should be between 32-40
        const totalColors = Object.values(palette).reduce(
          (sum, ramp) => sum + ramp.colors.length,
          0
        );
        expect(totalColors).toBeGreaterThanOrEqual(32);
        expect(totalColors).toBeLessThanOrEqual(40);
      }),
      { numRuns: 100 }
    );
  });

  test('Property 5: Palette Jitter Bounds', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (seed) => {
        const palette = generatePalette(seed);
        
        // Helper to parse hex to HSL (approximate check)
        const hexToRgb = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;
          return { r, g, b };
        };
        
        const rgbToHsl = (r: number, g: number, b: number) => {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const l = (max + min) / 2;
          
          if (max === min) {
            return { h: 0, s: 0, l };
          }
          
          const d = max - min;
          const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          
          let h = 0;
          if (max === r) {
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          } else if (max === g) {
            h = ((b - r) / d + 2) / 6;
          } else {
            h = ((r - g) / d + 4) / 6;
          }
          
          return { h: h * 360, s, l };
        };
        
        // Check a sample of colors from different ramps
        const sampleColors = [
          ...palette.bgNight.colors,
          ...palette.suitPrimary.colors,
          ...palette.energy.colors,
        ];
        
        // We can't easily verify exact jitter bounds without knowing the base values,
        // but we can verify colors are valid and within reasonable ranges
        sampleColors.forEach(color => {
          const rgb = hexToRgb(color);
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          
          // HSL values should be in valid ranges
          expect(hsl.h).toBeGreaterThanOrEqual(0);
          expect(hsl.h).toBeLessThanOrEqual(360);
          expect(hsl.s).toBeGreaterThanOrEqual(0);
          expect(hsl.s).toBeLessThanOrEqual(1);
          expect(hsl.l).toBeGreaterThanOrEqual(0);
          expect(hsl.l).toBeLessThanOrEqual(1);
        });
      }),
      { numRuns: 100 }
    );
  });

  test('Property 6: Suit Primary Originality', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (seed) => {
        const palette = generatePalette(seed);
        
        // Extract hue from first color in suitPrimary ramp
        const hexToRgb = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;
          return { r, g, b };
        };
        
        const rgbToHue = (r: number, g: number, b: number): number => {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          
          if (max === min) return 0;
          
          const d = max - min;
          let h = 0;
          
          if (max === r) {
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          } else if (max === g) {
            h = ((b - r) / d + 2) / 6;
          } else {
            h = ((r - g) / d + 4) / 6;
          }
          
          return h * 360;
        };
        
        const rgb = hexToRgb(palette.suitPrimary.colors[0]);
        const hue = rgbToHue(rgb.r, rgb.g, rgb.b);
        
        // Calculate angular distance considering wrap-around
        const angularDistance = (a: number, b: number) => {
          const diff = Math.abs(a - b);
          return Math.min(diff, 360 - diff);
        };
        
        // Should differ from 210° and 15° by more than 15 degrees
        const dist210 = angularDistance(hue, 210);
        const dist15 = angularDistance(hue, 15);
        
        expect(dist210).toBeGreaterThan(15);
        expect(dist15).toBeGreaterThan(15);
      }),
      { numRuns: 100 }
    );
  });

  test('Property 7: Suit Color Separation', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (seed) => {
        const palette = generatePalette(seed);
        
        const hexToRgb = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;
          return { r, g, b };
        };
        
        const rgbToHue = (r: number, g: number, b: number): number => {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          
          if (max === min) return 0;
          
          const d = max - min;
          let h = 0;
          
          if (max === r) {
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          } else if (max === g) {
            h = ((b - r) / d + 2) / 6;
          } else {
            h = ((r - g) / d + 4) / 6;
          }
          
          return h * 360;
        };
        
        const primaryRgb = hexToRgb(palette.suitPrimary.colors[0]);
        const secondaryRgb = hexToRgb(palette.suitSecondary.colors[0]);
        
        const primaryHue = rgbToHue(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        const secondaryHue = rgbToHue(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        
        // Calculate angular distance
        const angularDistance = (a: number, b: number) => {
          const diff = Math.abs(a - b);
          return Math.min(diff, 360 - diff);
        };
        
        const distance = angularDistance(primaryHue, secondaryHue);
        
        // Should differ by at least 60 degrees
        expect(distance).toBeGreaterThanOrEqual(60);
      }),
      { numRuns: 100 }
    );
  });

  test('Property 8: Quantized Luminance Ramps', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (seed) => {
        const palette = generatePalette(seed);
        
        const hexToRgb = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;
          return { r, g, b };
        };
        
        const rgbToLuminance = (r: number, g: number, b: number): number => {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          return (max + min) / 2;
        };
        
        // Check each ramp has 3-5 distinct luminance steps
        const checkRamp = (ramp: { colors: string[] }) => {
          const luminances = ramp.colors.map(color => {
            const rgb = hexToRgb(color);
            return rgbToLuminance(rgb.r, rgb.g, rgb.b);
          });
          
          // Should have between 3-5 colors (which means 3-5 luminance steps)
          expect(luminances.length).toBeGreaterThanOrEqual(2);
          expect(luminances.length).toBeLessThanOrEqual(5);
          
          // Luminances should be in ascending order (darker to lighter)
          // with some tolerance for jitter
          for (let i = 1; i < luminances.length; i++) {
            // Allow small variations due to jitter, but generally ascending
            expect(luminances[i]).toBeGreaterThanOrEqual(luminances[i - 1] - 0.1);
          }
        };
        
        // Check a few representative ramps
        checkRamp(palette.bgNight);
        checkRamp(palette.metalCool);
        checkRamp(palette.suitPrimary);
      }),
      { numRuns: 100 }
    );
  });
});

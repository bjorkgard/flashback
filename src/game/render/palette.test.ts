/**
 * Unit tests for palette generation
 */

import { describe, test, expect } from 'vitest';
import { mulberry32, hashStringToSeed, hslToHex, generatePalette } from './palette';

describe('RNG Functions', () => {
  test('mulberry32 generates numbers in [0, 1)', () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  test('hashStringToSeed produces consistent seeds', () => {
    const seed1 = hashStringToSeed('test');
    const seed2 = hashStringToSeed('test');
    expect(seed1).toBe(seed2);
  });

  test('hashStringToSeed produces different seeds for different strings', () => {
    const seed1 = hashStringToSeed('test1');
    const seed2 = hashStringToSeed('test2');
    expect(seed1).not.toBe(seed2);
  });
});

describe('HSL to Hex Conversion', () => {
  test('converts pure red correctly', () => {
    expect(hslToHex(0, 1, 0.5)).toBe('#ff0000');
  });

  test('converts pure green correctly', () => {
    expect(hslToHex(120, 1, 0.5)).toBe('#00ff00');
  });

  test('converts pure blue correctly', () => {
    expect(hslToHex(240, 1, 0.5)).toBe('#0000ff');
  });

  test('converts black correctly', () => {
    expect(hslToHex(0, 0, 0)).toBe('#000000');
  });

  test('converts white correctly', () => {
    expect(hslToHex(0, 0, 1)).toBe('#ffffff');
  });

  test('clamps out-of-range values', () => {
    const result = hslToHex(400, 1.5, -0.5);
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('Palette Generation', () => {
  test('generates palette with all required ramps', () => {
    const palette = generatePalette('test');
    
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
  });

  test('generates correct number of colors per ramp', () => {
    const palette = generatePalette('test');
    
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
  });

  test('generates valid hex colors', () => {
    const palette = generatePalette('test');
    const hexPattern = /^#[0-9a-f]{6}$/;
    
    Object.values(palette).forEach(ramp => {
      ramp.colors.forEach((color: string) => {
        expect(color).toMatch(hexPattern);
      });
    });
  });

  test('generates deterministic palettes', () => {
    const palette1 = generatePalette('test');
    const palette2 = generatePalette('test');
    
    expect(palette1).toEqual(palette2);
  });

  test('generates different palettes for different seeds', () => {
    const palette1 = generatePalette('seed1');
    const palette2 = generatePalette('seed2');
    
    expect(palette1).not.toEqual(palette2);
  });
});

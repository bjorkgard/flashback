/**
 * Seeded random number generator and palette generation
 * Implements mulberry32 PRNG for deterministic procedural generation
 */

/**
 * Mulberry32 seeded pseudo-random number generator
 * Returns a function that generates deterministic random numbers in [0, 1)
 * 
 * @param seed - Numeric seed value
 * @returns Function that returns random numbers in range [0, 1)
 */
export function mulberry32(seed: number): () => number {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts a string to a numeric seed for use with mulberry32
 * Uses a simple hash function to generate consistent seeds from strings
 * 
 * @param str - String to hash into a seed
 * @returns Numeric seed value
 */
export function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Palette ramp containing an array of hex color strings
 */
export interface PaletteRamp {
  colors: string[];
}

/**
 * Complete palette with all material ramps for the game
 */
export interface Palette {
  bgNight: PaletteRamp;
  metalCool: PaletteRamp;
  metalWarm: PaletteRamp;
  suitPrimary: PaletteRamp;
  suitSecondary: PaletteRamp;
  accentNeonA: PaletteRamp;
  accentNeonB: PaletteRamp;
  skin: PaletteRamp;
  energy: PaletteRamp;
  warning: PaletteRamp;
  shadowInk: PaletteRamp;
}

/**
 * Converts HSL color values to hex string
 * 
 * @param h - Hue in degrees [0, 360]
 * @param s - Saturation [0, 1]
 * @param l - Luminance [0, 1]
 * @returns Hex color string in format "#RRGGBB"
 */
export function hslToHex(h: number, s: number, l: number): string {
  // Clamp values to valid ranges
  h = ((h % 360) + 360) % 360; // Wrap hue to [0, 360]
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generates a complete deterministic color palette from a seed
 * 
 * @param seed - String seed for palette generation
 * @returns Complete palette with all material ramps
 */
export function generatePalette(seed: string): Palette {
  const rng = mulberry32(hashStringToSeed(seed));

  // Helper function for angular distance
  const angularDistance = (a: number, b: number) => {
    const diff = Math.abs(a - b);
    return Math.min(diff, 360 - diff);
  };

  // Helper to generate a ramp with jittered HSL values
  const generateRamp = (
    baseHue: number,
    baseSat: number,
    lumSteps: number[]
  ): PaletteRamp => {
    // Apply jitter to base values
    const hueJitter = (rng() - 0.5) * 10; // ±5°
    const satJitter = (rng() - 0.5) * 0.08; // ±0.04
    
    const jitteredHue = baseHue + hueJitter;
    const jitteredSat = baseSat + satJitter;

    const colors = lumSteps.map(lum => {
      const lumJitter = (rng() - 0.5) * 0.06; // ±0.03
      const jitteredLum = lum + lumJitter;
      return hslToHex(jitteredHue, jitteredSat, jitteredLum);
    });

    return { colors };
  };

  // bgNight: 4 colors, dark blue-purple night sky
  const bgNight = generateRamp(220, 0.35, [0.10, 0.14, 0.18, 0.24]);

  // metalCool: 5 colors, cool gray-blue metal
  const metalCool = generateRamp(210, 0.15, [0.20, 0.30, 0.40, 0.50, 0.60]);

  // metalWarm: 5 colors, warm gray-orange metal
  const metalWarm = generateRamp(30, 0.20, [0.25, 0.35, 0.45, 0.55, 0.65]);

  // suitPrimary: 4 colors, enforce originality constraints
  // Need to account for ±5° jitter, so check with 20° margin (15° + 5°)
  let suitPrimaryHue = rng() * 360;
  while (
    angularDistance(suitPrimaryHue, 210) <= 20 ||
    angularDistance(suitPrimaryHue, 15) <= 20
  ) {
    suitPrimaryHue = rng() * 360;
  }
  const suitPrimary = generateRamp(suitPrimaryHue, 0.60, [0.25, 0.40, 0.55, 0.70]);

  // suitSecondary: 4 colors, must differ from suitPrimary by at least 60°
  // Need to account for ±5° jitter on both colors, so check with 70° margin (60° + 10°)
  let suitSecondaryHue = rng() * 360;
  while (angularDistance(suitSecondaryHue, suitPrimaryHue) < 70) {
    suitSecondaryHue = rng() * 360;
  }
  const suitSecondary = generateRamp(suitSecondaryHue, 0.55, [0.30, 0.45, 0.60, 0.75]);

  // accentNeonA: 3 colors, bright cyan-ish neon
  const accentNeonA = generateRamp(180, 0.80, [0.50, 0.65, 0.80]);

  // accentNeonB: 3 colors, bright magenta-ish neon
  const accentNeonB = generateRamp(300, 0.75, [0.50, 0.65, 0.80]);

  // skin: 3 colors, human skin tones
  const skin = generateRamp(25, 0.45, [0.40, 0.55, 0.70]);

  // energy: 3 colors, bright energy/projectile colors
  const energy = generateRamp(120, 0.90, [0.50, 0.70, 0.85]);

  // warning: 3 colors, red/orange warning colors
  const warning = generateRamp(15, 0.85, [0.45, 0.60, 0.75]);

  // shadowInk: 2 colors, very dark for outlines
  const shadowInk = generateRamp(220, 0.20, [0.05, 0.10]);

  return {
    bgNight,
    metalCool,
    metalWarm,
    suitPrimary,
    suitSecondary,
    accentNeonA,
    accentNeonB,
    skin,
    energy,
    warning,
    shadowInk,
  };
}

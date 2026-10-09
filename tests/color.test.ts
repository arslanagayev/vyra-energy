import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb, luminance, mixHex, rgbToHex } from '../src/lib/color';

describe('hexToRgb', () => {
  it('parses 6 and 3 digit colours, with or without #', () => {
    expect(hexToRgb('#3c1a47')).toEqual({ r: 60, g: 26, b: 71 });
    expect(hexToRgb('B6FF00')).toEqual({ r: 182, g: 255, b: 0 });
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb(' #0a0 ')).toEqual({ r: 0, g: 170, b: 0 });
  });

  it.each(['', 'nope', '#12', '#12345', '#1234567', 'rgb(0 0 0)'])('rejects "%s"', (value) => {
    expect(() => hexToRgb(value)).toThrow(/Not a hex colour/);
  });
});

describe('rgbToHex', () => {
  it('formats, rounds and clamps channels', () => {
    expect(rgbToHex({ r: 60, g: 26, b: 71 })).toBe('#3c1a47');
    expect(rgbToHex({ r: 0.4, g: 254.6, b: 300 })).toBe('#00ffff');
    expect(rgbToHex({ r: -20, g: 0, b: 0 })).toBe('#000000');
  });

  it('round-trips with hexToRgb', () => {
    for (const hex of ['#0e0612', '#f3eefa', '#b6ff00', '#3c1a47']) {
      expect(rgbToHex(hexToRgb(hex))).toBe(hex);
    }
  });
});

describe('mixHex', () => {
  it('returns the ends at 0 and 1', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff');
  });

  it('blends linearly and clamps t', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixHex('#3c1a47', '#b6ff00', -1)).toBe('#3c1a47');
    expect(mixHex('#3c1a47', '#b6ff00', 3)).toBe('#b6ff00');
  });
});

describe('luminance and contrast', () => {
  it('matches the WCAG reference points', () => {
    expect(luminance('#000000')).toBe(0);
    expect(luminance('#ffffff')).toBeCloseTo(1, 10);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 10);
  });

  it('is symmetric and 1 for identical colours', () => {
    expect(contrastRatio('#b6ff00', '#3c1a47')).toBeCloseTo(contrastRatio('#3c1a47', '#b6ff00'));
    expect(contrastRatio('#3c1a47', '#3c1a47')).toBe(1);
  });

  it('gives the page text plenty of contrast on the background', () => {
    expect(contrastRatio('#f3eefa', '#0e0612')).toBeGreaterThan(15);
    expect(contrastRatio('#b6ff00', '#0e0612')).toBeGreaterThan(12);
  });
});

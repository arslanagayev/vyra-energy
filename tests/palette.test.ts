/**
 * The design rule, enforced: one two-colour combo (Charcoal Violet #3C1A47 + Cyber Line
 * #B6FF00), their tints and shades, and near-neutrals. Every colour literal in the shipped
 * source (CSS, TypeScript, HTML, SVG) must belong to one of those families.
 */
import { describe, expect, it } from 'vitest';
import { hexToRgb, type Rgb } from '../src/lib/color';

const sources = import.meta.glob<string>(
  ['../src/**/*.{ts,css}', '../index.html', '../public/*.svg'],
  { query: '?raw', import: 'default', eager: true },
);

const VIOLET_HUE = 285;
const LIME_HUE = 77;

function hue({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? (g - b) / d : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

/** Neutral, or a tint/shade of violet or lime. */
function inPalette(colour: Rgb): boolean {
  const spread = Math.max(colour.r, colour.g, colour.b) - Math.min(colour.r, colour.g, colour.b);
  if (spread <= 16) return true;
  const h = hue(colour);
  return hueDistance(h, VIOLET_HUE) <= 25 || hueDistance(h, LIME_HUE) <= 12;
}

function coloursIn(text: string): { literal: string; rgb: Rgb }[] {
  const found: { literal: string; rgb: Rgb }[] = [];
  for (const [literal] of text.matchAll(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/giu)) {
    found.push({ literal, rgb: hexToRgb(literal) });
  }
  for (const [literal, hex] of text.matchAll(/0x([0-9a-f]{6})\b/giu)) {
    found.push({ literal, rgb: hexToRgb(hex!) });
  }
  for (const [literal, r, g, b] of text.matchAll(/rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/giu)) {
    found.push({ literal, rgb: { r: Number(r), g: Number(g), b: Number(b) } });
  }
  return found;
}

describe('palette rule', () => {
  it('scans the shipped sources', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(10);
  });

  it.each(Object.entries(sources))('%s only uses violet, lime and neutrals', (_, text) => {
    const offenders = coloursIn(text)
      .filter(({ rgb }) => !inPalette(rgb))
      .map(({ literal }) => literal);
    expect(offenders).toEqual([]);
  });

  it('accepts the combo and rejects other hues', () => {
    expect(inPalette(hexToRgb('#3c1a47'))).toBe(true);
    expect(inPalette(hexToRgb('#b6ff00'))).toBe(true);
    expect(inPalette(hexToRgb('#f3eefa'))).toBe(true);
    expect(inPalette(hexToRgb('#ff4103'))).toBe(false);
    expect(inPalette(hexToRgb('#21f1a8'))).toBe(false);
    expect(inPalette(hexToRgb('#3178c6'))).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { BRAND, FEATURES, FLAVORS } from '../src/data/flavors';
import { DISPLAY_FAMILY, DISPLAY_FONT, TEXT_FAMILY, TEXT_FONT } from '../src/data/fonts';
import { contrastRatio } from '../src/lib/color';

const HEX6 = /^#[0-9a-f]{6}$/u;

describe('FLAVORS', () => {
  it('has five flavours with unique ids and names', () => {
    expect(FLAVORS).toHaveLength(5);
    expect(new Set(FLAVORS.map((f) => f.id)).size).toBe(FLAVORS.length);
    expect(new Set(FLAVORS.map((f) => f.name)).size).toBe(FLAVORS.length);
  });

  it.each(FLAVORS)('$name uses lower-case 6-digit hex colours', (flavor) => {
    for (const colour of [flavor.can, flavor.accent, flavor.ink, flavor.glow]) {
      expect(colour).toMatch(HEX6);
    }
  });

  it.each(FLAVORS)('$name prints readable logo and small print on its can', (flavor) => {
    expect(contrastRatio(flavor.accent, flavor.can)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(flavor.ink, flavor.can)).toBeGreaterThanOrEqual(3);
  });

  it.each(FLAVORS)('$name has plausible nutrition facts', (flavor) => {
    expect(flavor.caffeineMg).toBeGreaterThan(0);
    expect(flavor.caffeineMg).toBeLessThanOrEqual(200);
    expect(flavor.kcal).toBeGreaterThanOrEqual(0);
    expect(flavor.notes.length).toBeGreaterThan(10);
  });

  it('starts with the brand colourway', () => {
    expect(FLAVORS[0]!.can).toBe(BRAND.violet);
    expect(FLAVORS[0]!.accent).toBe(BRAND.lime);
  });

  it('has a distinct first word per flavour for the giant backdrop word', () => {
    const words = FLAVORS.map((f) => f.name.split(' ')[0]);
    expect(new Set(words).size).toBe(FLAVORS.length);
  });
});

describe('FEATURES', () => {
  it('has four callouts with unique ids and copy', () => {
    expect(FEATURES).toHaveLength(4);
    expect(new Set(FEATURES.map((f) => f.id)).size).toBe(FEATURES.length);
    for (const feature of FEATURES) {
      expect(feature.title.trim()).not.toBe('');
      expect(feature.body.trim()).not.toBe('');
    }
  });
});

describe('BRAND', () => {
  it('pairs Charcoal Violet with Cyber Line', () => {
    expect(BRAND).toEqual({
      violet: '#3c1a47',
      lime: '#b6ff00',
      night: '#0e0612',
      paper: '#f3eefa',
    });
  });
});

describe('fonts', () => {
  it('puts the self-hosted families first, with fallbacks', () => {
    expect(DISPLAY_FONT.startsWith(`"${DISPLAY_FAMILY}"`)).toBe(true);
    expect(TEXT_FONT.startsWith(`"${TEXT_FAMILY}"`)).toBe(true);
    expect(DISPLAY_FONT).toMatch(/sans-serif$/u);
    expect(TEXT_FONT).toMatch(/sans-serif$/u);
  });
});

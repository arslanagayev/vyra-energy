import { describe, expect, it } from 'vitest';
import { BRAND, FLAVORS } from '../src/data/flavors';
import { nearestIndex } from '../src/lib/layout';
import {
  LINEUP_DONE,
  activeFeature,
  backdropWordOpacity,
  counter,
  exitOpacity,
  featureOpacity,
  featureWindows,
  flavorCenter,
  flavorProgress,
  glowAt,
  noProgress,
  sceneGlow,
  scrollTargets,
  type SectionProgress,
} from '../src/lib/scroll';

const COUNT = FLAVORS.length;
const at = (overrides: Partial<SectionProgress>): SectionProgress => ({
  ...noProgress(),
  ...overrides,
});

describe('featureWindows', () => {
  it('covers the range in equal windows without gaps or overlaps', () => {
    const windows = featureWindows(4);
    expect(windows).toHaveLength(4);
    expect(windows[0]!.from).toBeCloseTo(0.1);
    expect(windows[3]!.to).toBeCloseTo(0.94);
    for (let i = 1; i < windows.length; i++) {
      expect(windows[i]!.from).toBeCloseTo(windows[i - 1]!.to);
      expect(windows[i]!.to - windows[i]!.from).toBeCloseTo(windows[0]!.to - windows[0]!.from);
    }
  });

  it('accepts a custom range', () => {
    expect(featureWindows(2, 0, 1)).toEqual([
      { from: 0, to: 0.5 },
      { from: 0.5, to: 1 },
    ]);
  });
});

describe('featureOpacity', () => {
  it('is 0 outside every window and 1 in the middle of its own', () => {
    const windows = featureWindows(4);
    windows.forEach((window, i) => {
      const middle = (window.from + window.to) / 2;
      expect(featureOpacity(middle, i, 4)).toBe(1);
      expect(featureOpacity(0, i, 4)).toBe(0);
      expect(featureOpacity(1, i, 4)).toBe(0);
      // Only one callout is fully visible at a time.
      windows.forEach((_, j) => {
        if (j !== i) expect(featureOpacity(middle, j, 4)).toBe(0);
      });
    });
  });

  it('fades in and out at the edges', () => {
    const [first] = featureWindows(4);
    const opacity = featureOpacity(first!.from + 0.01, 0, 4);
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });

  it('is 0 for a feature that does not exist', () => {
    expect(featureOpacity(0.5, 9, 4)).toBe(0);
  });
});

describe('activeFeature', () => {
  it('names the window the progress is in', () => {
    expect(activeFeature(0, 4)).toBe(-1);
    expect(activeFeature(0.12, 4)).toBe(0);
    expect(activeFeature(0.5, 4)).toBe(1);
    expect(activeFeature(0.9, 4)).toBe(3);
    expect(activeFeature(0.99, 4)).toBe(-1);
  });
});

describe('flavorCenter', () => {
  it('holds the selected flavour at the start and the last one at the end', () => {
    expect(flavorCenter(2, 0, COUNT)).toBe(2);
    expect(flavorCenter(2, 0.05, COUNT)).toBe(2);
    expect(flavorCenter(2, 0.95, COUNT)).toBe(2 + COUNT - 1);
    expect(flavorCenter(2, 1, COUNT)).toBe(2 + COUNT - 1);
  });

  it('turns through the flavours steadily in between', () => {
    expect(flavorCenter(0, 0.5, COUNT)).toBeCloseTo((COUNT - 1) / 2);
  });
});

describe('flavorProgress', () => {
  it('is the inverse of flavorCenter for every flavour and any selection', () => {
    for (const selected of [-3, 0, 2, 7]) {
      for (let i = 0; i < COUNT; i++) {
        const progress = flavorProgress(i, selected, COUNT);
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(1);
        expect(nearestIndex(flavorCenter(selected, progress, COUNT), COUNT)).toBe(i);
      }
    }
  });

  it('puts the selected flavour at the end of the opening hold', () => {
    expect(flavorProgress(3, 3, COUNT, 0.1)).toBe(0.1);
  });

  it('copes with a single flavour', () => {
    expect(flavorProgress(0, 0, 1, 0.08)).toBe(0.08);
  });
});

describe('scrollTargets', () => {
  it('rests on the hero selection at the top of the page', () => {
    expect(scrollTargets(noProgress(), 3, COUNT)).toEqual({
      center: 3,
      focus: 0,
      spin: 0,
      lineup: 0,
    });
  });

  it('zooms in while "What\'s inside" is pinned and spins with it', () => {
    const targets = scrollTargets(at({ insideIn: 1, inside: 0.4 }), 1, COUNT);
    expect(targets.focus).toBe(1);
    expect(targets.spin).toBe(0.4);
    expect(targets.center).toBe(1);
  });

  it('lets go of the close-up as the flavours slide in', () => {
    const half = scrollTargets(at({ insideIn: 1, inside: 1, flavorsIn: 0.5 }), 0, COUNT);
    expect(half.focus).toBe(0.5);
    const done = scrollTargets(at({ insideIn: 1, inside: 1, flavorsIn: 1 }), 0, COUNT);
    expect(done.focus).toBe(0);
  });

  it('turns the carousel through all flavours in the flavours section', () => {
    const end = at({ insideIn: 1, inside: 1, flavorsIn: 1, flavors: 1 });
    expect(scrollTargets(end, 2, COUNT).center).toBe(2 + COUNT - 1);
  });

  it('finishes the lineup before the end of its section', () => {
    const before = at({ lineupIn: 1, lineup: LINEUP_DONE / 2 });
    expect(scrollTargets(before, 0, COUNT).lineup).toBeCloseTo(0.5);
    expect(scrollTargets(at({ lineupIn: 1, lineup: LINEUP_DONE }), 0, COUNT).lineup).toBe(1);
    expect(scrollTargets(at({ lineupIn: 1, lineup: 1 }), 0, COUNT).lineup).toBe(1);
  });
});

describe('backdropWordOpacity', () => {
  it('only shows behind the flavour carousel', () => {
    expect(backdropWordOpacity(noProgress())).toBe(0);
    expect(backdropWordOpacity(at({ insideIn: 1, inside: 0.5 }))).toBe(0);
    expect(backdropWordOpacity(at({ flavorsIn: 1, flavors: 0.5 }))).toBe(1);
    expect(backdropWordOpacity(at({ flavorsIn: 1, flavors: 1, lineupIn: 1 }))).toBe(0);
  });
});

describe('exitOpacity', () => {
  it('fades pinned copy out during the first half of the next section sliding in', () => {
    expect(exitOpacity(0)).toBe(1);
    expect(exitOpacity(0.2)).toBeCloseTo(0.56);
    expect(exitOpacity(0.5)).toBe(0);
    expect(exitOpacity(1)).toBe(0);
  });
});

describe('glowAt / sceneGlow', () => {
  it('equals the flavour glow at whole indices, wrapping both ways', () => {
    FLAVORS.forEach((flavor, i) => {
      expect(glowAt(i, FLAVORS)).toBe(flavor.glow);
      expect(glowAt(i + COUNT, FLAVORS)).toBe(flavor.glow);
      expect(glowAt(i - COUNT, FLAVORS)).toBe(flavor.glow);
    });
  });

  it('blends between neighbours', () => {
    const between = glowAt(0.5, FLAVORS);
    expect(between).not.toBe(FLAVORS[0]!.glow);
    expect(between).not.toBe(FLAVORS[1]!.glow);
  });

  it('falls back to black without flavours', () => {
    expect(glowAt(0, [])).toBe('#000000');
  });

  it('returns to the brand colour as the cans line up', () => {
    expect(sceneGlow(2, 0, FLAVORS, BRAND.violet)).toBe(FLAVORS[2]!.glow);
    expect(sceneGlow(2, 1, FLAVORS, BRAND.violet)).toBe(BRAND.violet);
  });
});

describe('counter', () => {
  it('pads both numbers', () => {
    expect(counter(0, 5)).toBe('01 / 05');
    expect(counter(11, 12)).toBe('12 / 12');
  });
});

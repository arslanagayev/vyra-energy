import { describe, expect, it } from 'vitest';
import {
  LAYOUT,
  arcPose,
  computeLayout,
  focusPose,
  initialState,
  introProgress,
  lineupPose,
  lineupProgress,
  mixPose,
  nearestIndex,
  ringOpacity,
  type SceneState,
} from '../src/lib/layout';

const COUNT = 5;
const settled = (overrides: Partial<SceneState> = {}): SceneState => ({
  ...initialState(),
  intro: 1,
  ...overrides,
});

describe('initialState', () => {
  it('starts before the intro with everything at rest', () => {
    expect(initialState()).toEqual({ intro: 0, center: 0, focus: 0, spin: 0, lineup: 0, time: 0 });
  });
});

describe('nearestIndex', () => {
  it('rounds the continuous centre and wraps it onto the ring', () => {
    expect(nearestIndex(2.4, COUNT)).toBe(2);
    expect(nearestIndex(2.6, COUNT)).toBe(3);
    expect(nearestIndex(-1, COUNT)).toBe(4);
    expect(nearestIndex(4.6, COUNT)).toBe(0);
    expect(nearestIndex(12, COUNT)).toBe(2);
  });
});

describe('arcPose', () => {
  it('lifts the centre can and keeps it facing the camera', () => {
    const centre = arcPose(0);
    expect(centre).toMatchObject({ x: 0, y: LAYOUT.lift, z: 0, scale: 1, visibility: 1 });
    expect(centre.rotY).toBeCloseTo(0);
  });

  it('is mirror-symmetric around the centre', () => {
    for (const offset of [0.5, 1, 2]) {
      const right = arcPose(offset);
      const left = arcPose(-offset);
      expect(left.x).toBeCloseTo(-right.x);
      expect(left.rotY).toBeCloseTo(-right.rotY);
      expect(left.y).toBe(right.y);
      expect(left.z).toBe(right.z);
      expect(left.scale).toBe(right.scale);
    }
  });

  it('puts neighbours behind and below the centre, smaller', () => {
    const centre = arcPose(0);
    const side = arcPose(1);
    expect(side.z).toBeLessThan(centre.z);
    expect(side.y).toBeLessThan(centre.y);
    expect(side.scale).toBeLessThan(centre.scale);
  });

  it('hides cans near the wrap seam so the carousel never pops', () => {
    expect(arcPose(2).visibility).toBe(1);
    expect(arcPose(LAYOUT.hideTo).visibility).toBe(0);
    expect(arcPose(-2.5).visibility).toBe(0);
    const fading = arcPose((LAYOUT.hideFrom + LAYOUT.hideTo) / 2).visibility;
    expect(fading).toBeGreaterThan(0);
    expect(fading).toBeLessThan(1);
  });
});

describe('focusPose', () => {
  it('brings the centre can forward and makes it bigger', () => {
    const close = focusPose(0, 0);
    expect(close.z).toBe(LAYOUT.focusZ);
    expect(close.z).toBeGreaterThan(arcPose(0).z);
    expect(close.scale).toBe(LAYOUT.focusScale);
  });

  it('spins the can with scroll progress', () => {
    expect(focusPose(0, 0).rotY).toBe(0);
    expect(focusPose(0, 1).rotY).toBeCloseTo(Math.PI * 2 * LAYOUT.spinTurns);
    expect(focusPose(0.2, 0.5).rotY).toBeCloseTo(Math.PI * LAYOUT.spinTurns);
  });

  it('sends every other can out of the frame, to its own side', () => {
    for (const offset of [-2, -1, 1, 2]) {
      const pose = focusPose(offset, 0.3);
      expect(pose.y).toBeLessThan(-2);
      expect(Math.abs(pose.x)).toBeGreaterThan(3);
      expect(Math.sign(pose.x)).toBe(Math.sign(offset));
    }
  });
});

describe('lineupPose', () => {
  it('centres the row and keeps flavour order from left to right', () => {
    const xs = Array.from({ length: COUNT }, (_, i) => lineupPose(i, COUNT).x);
    expect(xs[2]).toBe(0);
    expect(xs[0]).toBe(-xs[4]!);
    for (let i = 1; i < COUNT; i++) expect(xs[i]!).toBeGreaterThan(xs[i - 1]!);
  });
});

describe('mixPose', () => {
  it('returns each end at t = 0 and t = 1', () => {
    const a = arcPose(1);
    const b = lineupPose(3, COUNT);
    expect(mixPose(a, b, 0)).toEqual(a);
    // lerp(a, b, 1) is b up to floating-point rounding.
    for (const [key, value] of Object.entries(mixPose(a, b, 1))) {
      expect(value).toBeCloseTo(b[key as keyof typeof b], 12);
    }
    expect(mixPose(a, b, 0.5).x).toBeCloseTo((a.x + b.x) / 2);
  });
});

describe('lineupProgress', () => {
  it('runs from 0 to 1 for every can', () => {
    for (let i = 0; i < COUNT; i++) {
      expect(lineupProgress(0, i, COUNT)).toBe(0);
      expect(lineupProgress(1, i, COUNT)).toBe(1);
    }
  });

  it('brings the cans in from left to right', () => {
    expect(lineupProgress(0.4, 0, COUNT)).toBeGreaterThan(lineupProgress(0.4, 4, COUNT));
  });

  it('copes with a single can', () => {
    expect(lineupProgress(1, 0, 1)).toBe(1);
  });
});

describe('introProgress', () => {
  it('raises the centre can first', () => {
    expect(introProgress(0, 0)).toBe(0);
    expect(introProgress(0.3, 0)).toBeGreaterThan(introProgress(0.3, 2));
    expect(introProgress(1, 2)).toBe(1);
  });
});

describe('computeLayout', () => {
  it('returns one transform per can', () => {
    expect(computeLayout(settled(), COUNT)).toHaveLength(COUNT);
  });

  it('makes the selected can the highest and the frontmost', () => {
    for (const center of [0, 2, 4, 7, -3]) {
      const layout = computeLayout(settled({ center }), COUNT);
      const selected = layout[nearestIndex(center, COUNT)]!;
      for (const pose of layout) {
        if (pose === selected) continue;
        expect(selected.y).toBeGreaterThan(pose.y);
        expect(selected.z).toBeGreaterThan(pose.z);
      }
    }
  });

  it('hides the can at the wrap seam mid-slide', () => {
    // Half way between flavour 0 and 1, flavour 3 sits exactly opposite the camera.
    const layout = computeLayout(settled({ center: 0.5 }), COUNT);
    expect(layout[3]!.visibility).toBe(0);
    expect(layout[0]!.visibility).toBe(1);
  });

  it('starts every can below the floor before the intro', () => {
    for (const pose of computeLayout(initialState(), COUNT)) expect(pose.y).toBeLessThan(-2);
  });

  it('focuses the selected can and clears the stage of the rest', () => {
    const layout = computeLayout(settled({ center: 1, focus: 1 }), COUNT);
    expect(layout[1]!.z).toBeCloseTo(LAYOUT.focusZ);
    expect(layout[1]!.scale).toBeCloseTo(LAYOUT.focusScale);
    for (const i of [0, 2, 3, 4]) expect(layout[i]!.y).toBeLessThan(-2);
  });

  it('lines the cans up in flavour order, whatever was selected', () => {
    for (const center of [0, 3, 8]) {
      const layout = computeLayout(settled({ center, lineup: 1, time: 4 }), COUNT);
      layout.forEach((pose, i) => {
        expect(pose.x).toBeCloseTo(lineupPose(i, COUNT).x);
        // Idle motion stops once the cans are in their row.
        expect(pose.y).toBeCloseTo(0);
      });
    }
  });

  it('adds a gentle idle bob over time while resting', () => {
    const still = computeLayout(settled({ time: 0 }), COUNT)[0]!;
    const later = computeLayout(settled({ time: 1.3 }), COUNT)[0]!;
    expect(later.y).not.toBeCloseTo(still.y, 5);
    expect(Math.abs(later.y - still.y)).toBeLessThan(0.06);
  });
});

describe('ringOpacity', () => {
  it('appears with the intro and leaves for the close-up and the lineup', () => {
    expect(ringOpacity(initialState())).toBe(0);
    expect(ringOpacity(settled())).toBe(1);
    expect(ringOpacity(settled({ focus: 1 }))).toBe(0);
    expect(ringOpacity(settled({ lineup: 1 }))).toBe(0);
    expect(ringOpacity(settled({ focus: 0.5 }))).toBeCloseTo(0.5);
  });
});

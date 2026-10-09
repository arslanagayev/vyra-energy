import { describe, expect, it } from 'vitest';
import {
  circularOffset,
  clamp,
  damp,
  easeInOutCubic,
  easeOutCubic,
  invLerp,
  lerp,
  mapRange,
  smoothstep,
  wrap,
} from '../src/lib/math';

describe('clamp', () => {
  it('defaults to the 0..1 range', () => {
    expect(clamp(-0.5)).toBe(0);
    expect(clamp(0.25)).toBe(0.25);
    expect(clamp(7)).toBe(1);
  });

  it('accepts a custom range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-3, -2, 2)).toBe(-2);
  });
});

describe('lerp / invLerp / mapRange', () => {
  it('interpolates and extrapolates linearly', () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 0.5)).toBe(15);
    expect(lerp(10, 20, 2)).toBe(30);
  });

  it('inverts lerp and clamps', () => {
    expect(invLerp(0, 10, 5)).toBe(0.5);
    expect(invLerp(0, 10, -5)).toBe(0);
    expect(invLerp(0, 10, 50)).toBe(1);
    expect(invLerp(10, 0, 2.5)).toBe(0.75);
  });

  it('treats an empty range as the start instead of dividing by zero', () => {
    expect(invLerp(3, 3, 3)).toBe(0);
  });

  it('maps between ranges, clamped to the output', () => {
    expect(mapRange(5, 0, 10, 100, 200)).toBe(150);
    expect(mapRange(20, 0, 10, 100, 200)).toBe(200);
  });
});

describe('easings', () => {
  const curves = { smoothstep, easeOutCubic, easeInOutCubic };

  it.each(Object.entries(curves))('%s hits 0 and 1 and clamps outside', (_, ease) => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(-1)).toBe(0);
    expect(ease(2)).toBe(1);
  });

  it.each(Object.entries(curves))('%s never goes backwards', (_, ease) => {
    let previous = -Infinity;
    for (let t = 0; t <= 1.0001; t += 0.01) {
      const value = ease(t);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it('symmetric curves pass through the middle', () => {
    expect(smoothstep(0.5)).toBe(0.5);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe('damp', () => {
  it('converges on the target', () => {
    let value = 0;
    for (let i = 0; i < 120; i++) value = damp(value, 10, 7, 1 / 60);
    expect(value).toBeCloseTo(10, 4);
  });

  it('is frame-rate independent', () => {
    const once = damp(0, 1, 6, 1 / 30);
    const twice = damp(damp(0, 1, 6, 1 / 60), 1, 6, 1 / 60);
    expect(twice).toBeCloseTo(once, 12);
  });

  it('does not move without time and never overshoots', () => {
    expect(damp(3, 9, 7, 0)).toBe(3);
    expect(damp(3, 9, 7, 100)).toBeCloseTo(9, 10);
  });
});

describe('wrap', () => {
  it('is a positive modulo', () => {
    expect(wrap(-1, 5)).toBe(4);
    expect(wrap(7, 5)).toBe(2);
    expect(wrap(5, 5)).toBe(0);
    expect(wrap(-11, 5)).toBe(4);
    expect(wrap(2.5, 5)).toBe(2.5);
  });
});

describe('circularOffset', () => {
  it('finds the short way around the ring', () => {
    expect(circularOffset(0, 0, 5)).toBe(0);
    expect(circularOffset(1, 0, 5)).toBe(1);
    expect(circularOffset(4, 0, 5)).toBe(-1);
    expect(circularOffset(0, 4, 5)).toBe(1);
    expect(circularOffset(2, -3, 5)).toBe(0);
  });

  it('works with fractional centres', () => {
    expect(circularOffset(0, 0.5, 5)).toBe(-0.5);
    expect(circularOffset(1, 0.5, 5)).toBe(0.5);
  });

  it('always stays inside (-size/2, size/2]', () => {
    for (let center = -7; center <= 7; center += 0.25) {
      for (let i = 0; i < 5; i++) {
        const offset = circularOffset(i, center, 5);
        expect(offset).toBeGreaterThan(-2.5);
        expect(offset).toBeLessThanOrEqual(2.5);
      }
    }
  });
});

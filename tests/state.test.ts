import { describe, expect, it } from 'vitest';
import { initialState } from '../src/lib/layout';
import { FOLLOW_RATE, followTargets } from '../src/lib/state';

const targets = { center: 4, focus: 1, spin: 0.5, lineup: 0.25 };

describe('followTargets', () => {
  it('moves part of the way each frame', () => {
    const next = followTargets(initialState(), targets, 1 / 60);
    expect(next.center).toBeGreaterThan(0);
    expect(next.center).toBeLessThan(4);
    expect(next.focus).toBeCloseTo(1 - Math.exp(-FOLLOW_RATE / 60));
  });

  it('settles on the targets', () => {
    let state = initialState();
    for (let i = 0; i < 240; i++) state = followTargets(state, targets, 1 / 60);
    expect(state.center).toBeCloseTo(4, 5);
    expect(state.focus).toBeCloseTo(1, 5);
    expect(state.spin).toBeCloseTo(0.5, 5);
    expect(state.lineup).toBeCloseTo(0.25, 5);
  });

  it('leaves the intro and the clock to their owners and does not mutate', () => {
    const state = { ...initialState(), intro: 0.3, time: 12 };
    const next = followTargets(state, targets, 0.1, 10);
    expect(next.intro).toBe(0.3);
    expect(next.time).toBe(12);
    expect(state.center).toBe(0);
  });
});

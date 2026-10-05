/** Small, dependency-free maths helpers shared by the scene and the scroll logic. */

export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/** Where `value` sits between `from` and `to`, clamped to 0..1. */
export const invLerp = (from: number, to: number, value: number): number =>
  from === to ? 0 : clamp((value - from) / (to - from));

/** Maps `value` from one range to another, clamped to the output range. */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => lerp(outMin, outMax, invLerp(inMin, inMax, value));

export const smoothstep = (t: number): number => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

export const easeOutCubic = (t: number): number => 1 - (1 - clamp(t)) ** 3;

export const easeInOutCubic = (t: number): number => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
};

/**
 * Frame-rate independent smoothing: moves `current` towards `target` as if by an exponential
 * spring with rate `lambda` (per second). `dt` is in seconds.
 */
export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

/** Positive modulo: wrap(-1, 5) === 4. */
export const wrap = (value: number, size: number): number => ((value % size) + size) % size;

/**
 * Signed distance from `center` to `index` around a ring of `size` items, in (-size/2, size/2].
 * Works with fractional centres, which is what lets the carousel slide continuously.
 */
export const circularOffset = (index: number, center: number, size: number): number => {
  let offset = wrap(index - center, size);
  if (offset > size / 2) offset -= size;
  return offset;
};

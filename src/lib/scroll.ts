/**
 * Pure mapping from section scroll progress (0..1) to what the page shows. ScrollTrigger only
 * measures progress; everything it means lives here so it can be tested.
 */
import type { Flavor } from '../data/flavors';
import { mixHex } from './color';
import { clamp, invLerp, wrap } from './math';

export interface Window {
  from: number;
  to: number;
}

/** Splits the [start, end] part of a section into `count` equal windows, one per feature. */
export function featureWindows(count: number, start = 0.1, end = 0.94): Window[] {
  const size = (end - start) / count;
  return Array.from({ length: count }, (_, i) => ({
    from: start + i * size,
    to: start + (i + 1) * size,
  }));
}

/** Opacity of feature `index`: fades in at the start of its window and out at the end. */
export function featureOpacity(
  progress: number,
  index: number,
  count: number,
  fade = 0.035,
): number {
  const window = featureWindows(count)[index];
  if (!window) return 0;
  const fadeIn = invLerp(window.from, window.from + fade, progress);
  const fadeOut = 1 - invLerp(window.to - fade, window.to, progress);
  return clamp(Math.min(fadeIn, fadeOut));
}

/** The feature that is mostly visible, or -1 outside every window. */
export function activeFeature(progress: number, count: number): number {
  return featureWindows(count).findIndex((w) => progress >= w.from && progress < w.to);
}

/**
 * In the flavours section the carousel turns from the selected can through every other
 * flavour. A short hold at both ends keeps the first and last flavour on screen a moment.
 */
export function flavorCenter(
  selected: number,
  progress: number,
  count: number,
  hold = 0.08,
): number {
  const travel = invLerp(hold, 1 - hold, progress);
  return selected + travel * (count - 1);
}

/** Glow colour between the two flavours either side of a fractional centre. */
export function glowAt(center: number, flavors: readonly Flavor[]): string {
  const count = flavors.length;
  const lower = Math.floor(center);
  const a = flavors[wrap(lower, count)];
  const b = flavors[wrap(lower + 1, count)];
  if (!a || !b) return '#000000';
  return mixHex(a.glow, b.glow, center - lower);
}

/** Formats "01 / 05" style counters. */
export const counter = (index: number, count: number): string =>
  `${String(index + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;

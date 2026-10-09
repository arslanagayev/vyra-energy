/**
 * Pure mapping from section scroll progress (0..1) to what the page shows. ScrollTrigger only
 * measures progress; everything it means lives here so it can be tested.
 */
import type { Flavor } from '../data/flavors';
import { mixHex } from './color';
import type { SceneState } from './layout';
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

/**
 * Inverse of flavorCenter(): the progress at which flavour `index` sits in the middle, going
 * forwards from `selected`. Used to scroll to a flavour when its swatch is clicked.
 */
export function flavorProgress(
  index: number,
  selected: number,
  count: number,
  hold = 0.08,
): number {
  if (count < 2) return hold;
  const steps = wrap(index - Math.round(selected), count);
  return hold + (steps / (count - 1)) * (1 - 2 * hold);
}

/** Scroll progress (0..1) of each phase of the page, as measured by ScrollTrigger. */
export interface SectionProgress {
  /** #inside scrolling into view: its top goes from the bottom of the viewport to the top. */
  insideIn: number;
  /** #inside pinned: its sticky child stays put while the section scrolls past. */
  inside: number;
  flavorsIn: number;
  flavors: number;
  lineupIn: number;
  lineup: number;
}

export const noProgress = (): SectionProgress => ({
  insideIn: 0,
  inside: 0,
  flavorsIn: 0,
  flavors: 0,
  lineupIn: 0,
  lineup: 0,
});

/** The cans are fully in a row at this much of the pinned lineup section. */
export const LINEUP_DONE = 0.7;

/** The part of the scene that scrolling decides. Intro and time are owned by the page clock. */
export type ScrollTargets = Pick<SceneState, 'center' | 'focus' | 'spin' | 'lineup'>;

/**
 * The whole scroll choreography in one place: section progress + the flavour picked in the
 * hero → where the scene should be heading. The render loop eases towards these numbers.
 */
export function scrollTargets(
  progress: SectionProgress,
  heroCenter: number,
  count: number,
): ScrollTargets {
  return {
    // The carousel turns through every flavour while the flavours section is pinned.
    center: flavorCenter(heroCenter, progress.flavors, count),
    // Close-up while "What's inside" is on screen, released as the flavours slide in.
    focus: progress.insideIn * (1 - progress.flavorsIn),
    spin: progress.inside,
    lineup: invLerp(0, LINEUP_DONE, progress.lineup),
  };
}

/**
 * Pinned text fades out as soon as the next section starts to slide in, so two sections'
 * copy never sits on top of each other (or of the cans) mid-transition.
 */
export const exitOpacity = (nextIn: number): number => 1 - clamp(nextIn * 2.2);

/** The giant outlined flavour word only shows behind the flavour carousel. */
export const backdropWordOpacity = (progress: SectionProgress): number =>
  progress.flavorsIn * (1 - progress.lineupIn);

/** Glow colour between the two flavours either side of a fractional centre. */
export function glowAt(center: number, flavors: readonly Flavor[]): string {
  const count = flavors.length;
  const lower = Math.floor(center);
  const a = flavors[wrap(lower, count)];
  const b = flavors[wrap(lower + 1, count)];
  if (!a || !b) return '#000000';
  return mixHex(a.glow, b.glow, center - lower);
}

/** Page glow: the flavour in the middle, blending back to `rest` as the cans line up. */
export const sceneGlow = (
  center: number,
  lineup: number,
  flavors: readonly Flavor[],
  rest: string,
): string => mixHex(glowAt(center, flavors), rest, lineup);

/** Formats "01 / 05" style counters. */
export const counter = (index: number, count: number): string =>
  `${String(index + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;

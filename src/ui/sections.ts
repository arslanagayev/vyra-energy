/**
 * ScrollTrigger is used as a ruler only: each phase of the page gets a trigger that measures
 * its progress, and src/lib/scroll.ts decides what that progress means.
 */
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LINEUP_DONE, type SectionProgress } from '../lib/scroll';
import { lerp } from '../lib/math';

type Phase = keyof SectionProgress;

const PHASES: Record<Phase, [trigger: string, start: string, end: string]> = {
  insideIn: ['#inside', 'top bottom', 'top top'],
  inside: ['#inside', 'top top', 'bottom bottom'],
  flavorsIn: ['#flavors', 'top bottom', 'top top'],
  flavors: ['#flavors', 'top top', 'bottom bottom'],
  lineupIn: ['#lineup', 'top bottom', 'top top'],
  lineup: ['#lineup', 'top top', 'bottom bottom'],
};

/** Where an in-page link should land: a moment in its section where the scene is settled. */
const LANDINGS: Record<string, [Phase, number] | undefined> = {
  hero: ['insideIn', 0],
  inside: ['inside', 0.16],
  flavors: ['flavors', 0.04],
  lineup: ['lineup', LINEUP_DONE + 0.1],
};

export interface SectionMeter {
  read(): SectionProgress;
  /** Page scroll position (px) at `progress` through a phase. */
  scrollY(phase: Phase, progress: number): number;
  /** Scroll position for a link to `#id`, or null when the id is not a section. */
  landingY(id: string): number | null;
  kill(): void;
}

export function measureSections(): SectionMeter {
  const triggers = Object.fromEntries(
    Object.entries(PHASES).map(([phase, [trigger, start, end]]) => [
      phase,
      ScrollTrigger.create({ trigger, start, end }),
    ]),
  ) as Record<Phase, ScrollTrigger>;

  const scrollY = (phase: Phase, progress: number): number =>
    lerp(triggers[phase].start, triggers[phase].end, progress);

  return {
    read: () => ({
      insideIn: triggers.insideIn.progress,
      inside: triggers.inside.progress,
      flavorsIn: triggers.flavorsIn.progress,
      flavors: triggers.flavors.progress,
      lineupIn: triggers.lineupIn.progress,
      lineup: triggers.lineup.progress,
    }),
    scrollY,
    landingY: (id) => {
      const landing = LANDINGS[id];
      return landing ? scrollY(...landing) : null;
    },
    kill: () => {
      for (const trigger of Object.values(triggers)) trigger.kill();
    },
  };
}

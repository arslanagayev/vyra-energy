/**
 * Scroll and clicks only set targets; the scene follows them with frame-rate independent
 * damping, so a jump in scroll position (or a click on an arrow) still glides.
 */
import type { SceneState } from './layout';
import { damp } from './math';
import type { ScrollTargets } from './scroll';

/** Damping rate per second: ~0.3 s to cover 90 % of a change. */
export const FOLLOW_RATE = 7;

/** One frame of easing towards `targets`. Returns a new state; intro and time are untouched. */
export function followTargets(
  state: SceneState,
  targets: ScrollTargets,
  dt: number,
  rate = FOLLOW_RATE,
): SceneState {
  return {
    ...state,
    center: damp(state.center, targets.center, rate, dt),
    focus: damp(state.focus, targets.focus, rate, dt),
    spin: damp(state.spin, targets.spin, rate, dt),
    lineup: damp(state.lineup, targets.lineup, rate, dt),
  };
}

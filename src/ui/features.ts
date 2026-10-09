/**
 * "What's inside": the four callouts take turns while the can spins. Each one rises in at the
 * start of its scroll window and drifts up and out at the end; the meter shows the progress.
 */
import { featureOpacity, featureWindows } from '../lib/scroll';
import { styleWriter } from './dom';

export interface FeatureCallouts {
  update(progress: number): void;
}

export function createFeatureCallouts(
  items: readonly HTMLElement[],
  meter: HTMLElement,
  reducedMotion: boolean,
): FeatureCallouts {
  const windows = featureWindows(items.length);
  const writers = items.map(styleWriter);
  const writeMeter = styleWriter(meter);
  const travel = reducedMotion ? 0 : 28;

  return {
    update(progress) {
      items.forEach((_, i) => {
        const write = writers[i];
        const window = windows[i];
        if (!write || !window) return;
        const opacity = featureOpacity(progress, i, items.length);
        const before = progress < (window.from + window.to) / 2 ? 1 : -1;
        write('opacity', opacity.toFixed(3));
        write('transform', `translate3d(0, ${(before * (1 - opacity) * travel).toFixed(1)}px, 0)`);
      });
      writeMeter('--progress', progress.toFixed(4));
    },
  };
}

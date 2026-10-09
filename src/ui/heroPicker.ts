/**
 * The ‹ › flavour picker in the hero. It owns `center`, the flavour the carousel rests on.
 * The value is never wrapped, so the cans always travel the way the arrow points.
 */
import type { Flavor } from '../data/flavors';
import { nearestIndex } from '../lib/layout';
import { counter } from '../lib/scroll';
import { requireAll, requireElement } from './dom';

export interface HeroPicker {
  readonly center: number;
}

interface Options {
  root: HTMLElement;
  flavors: readonly Flavor[];
  /** Arrow keys only steer the carousel while the hero is on screen. */
  isActive: () => boolean;
  signal: AbortSignal;
}

export function initHeroPicker({ root, flavors, isActive, signal }: Options): HeroPicker {
  const count = requireElement(root, '.picker__count', HTMLElement);
  const name = requireElement(root, '.picker__name', HTMLElement);
  let center = 0;

  const step = (by: number): void => {
    center += by;
    const index = nearestIndex(center, flavors.length);
    count.textContent = counter(index, flavors.length);
    name.textContent = flavors[index]?.name ?? '';
  };

  for (const button of requireAll(root, '[data-step]', HTMLButtonElement)) {
    const by = Number(button.dataset.step);
    button.addEventListener(
      'click',
      () => {
        step(by);
      },
      { signal },
    );
  }

  window.addEventListener(
    'keydown',
    (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (!isActive()) return;
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    },
    { signal },
  );

  step(0);
  return {
    get center() {
      return center;
    },
  };
}

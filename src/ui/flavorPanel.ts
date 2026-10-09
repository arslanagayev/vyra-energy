/**
 * The flavours section: a card that follows the can in the middle of the carousel, a row of
 * swatches to jump to a flavour, and the giant outlined word behind the cans.
 */
import { gsap } from 'gsap';
import type { Flavor } from '../data/flavors';
import { counter } from '../lib/scroll';
import { requireElement, styleWriter } from './dom';

export interface FlavorPanel {
  /** Shows flavour `index` (no-op when it is already shown). */
  show(index: number): void;
  setWordOpacity(opacity: number): void;
}

interface Options {
  card: HTMLElement;
  swatches: readonly HTMLButtonElement[];
  word: HTMLElement;
  flavors: readonly Flavor[];
  reducedMotion: boolean;
  /** A swatch was clicked: the page scrolls until that flavour is in the middle. */
  onPick: (index: number) => void;
  signal: AbortSignal;
}

/** ORIGINAL, ZERO, LIME… the first word of the name is the one printed huge. */
const headline = (flavor: Flavor): string => flavor.name.split(' ')[0] ?? flavor.name;

export function initFlavorPanel(options: Options): FlavorPanel {
  const { card, swatches, word, flavors, reducedMotion, onPick, signal } = options;
  const fields = {
    count: requireElement(card, '.flavor-card__count', HTMLElement),
    name: requireElement(card, '.flavor-card__name', HTMLElement),
    notes: requireElement(card, '.flavor-card__notes', HTMLElement),
    caffeine: requireElement(card, '[data-stat="caffeine"]', HTMLElement),
    kcal: requireElement(card, '[data-stat="kcal"]', HTMLElement),
  };
  const stats = requireElement(card, '.flavor-card__stats', HTMLElement);
  const parts = [fields.count, fields.name, fields.notes, stats];
  // The word's opacity follows the scroll; its inner span is what animates on a swap.
  const wordText = document.createElement('span');
  word.replaceChildren(wordText);
  const writeWord = styleWriter(word);
  let shown = -1;
  let swap: gsap.core.Timeline | null = null;

  const fill = (flavor: Flavor, index: number): void => {
    fields.count.textContent = counter(index, flavors.length);
    fields.name.textContent = flavor.name;
    fields.notes.textContent = flavor.notes;
    fields.caffeine.textContent = `${flavor.caffeineMg} mg`;
    fields.kcal.textContent = `${flavor.kcal} kcal`;
    wordText.textContent = headline(flavor);
  };

  const show = (index: number): void => {
    const flavor = flavors[index];
    if (!flavor || index === shown) return;
    const first = shown < 0;
    shown = index;
    swatches.forEach((swatch, i) => {
      swatch.setAttribute('aria-pressed', String(i === index));
    });

    if (first || reducedMotion) {
      fill(flavor, index);
      return;
    }
    // A fast scroll can pass several flavours mid-swap: drop the old swap, fill included.
    swap?.kill();
    swap = gsap
      .timeline()
      .to(parts, { opacity: 0, y: -10, duration: 0.14, ease: 'power2.in' })
      .to(wordText, { opacity: 0, duration: 0.14 }, 0)
      .call(() => {
        fill(flavor, index);
      })
      .fromTo(
        parts,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.04 },
      )
      .fromTo(
        wordText,
        { opacity: 0, yPercent: 6 },
        { opacity: 1, yPercent: 0, duration: 0.6, ease: 'power3.out' },
        '<',
      );
  };

  swatches.forEach((swatch, i) => {
    swatch.addEventListener(
      'click',
      () => {
        onPick(i);
      },
      { signal },
    );
  });

  show(0);
  return {
    show,
    setWordOpacity: (opacity) => {
      writeWord('opacity', opacity.toFixed(3));
    },
  };
}

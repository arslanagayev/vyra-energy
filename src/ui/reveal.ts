/**
 * Text reveals. Each `.line` clips its inner span, which slides up into view. CSS hides the
 * spans before the first paint (only when JS runs and motion is allowed), so nothing flashes.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const lineSpans = (root: ParentNode): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('.line > span'));

function slideUp(spans: HTMLElement[], delay = 0): void {
  gsap.fromTo(
    spans,
    // `y: 0` resets the pixel offset GSAP reads from the CSS transform, so only yPercent moves.
    { yPercent: 105, y: 0 },
    { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.09, delay },
  );
}

/** Hero headline on load. */
export function revealHero(hero: HTMLElement, reducedMotion: boolean): void {
  if (reducedMotion) return;
  slideUp(lineSpans(hero), 0.15);
}

/** Display headings further down slide in once, when their section scrolls into view. */
export function revealOnScroll(headings: readonly HTMLElement[], reducedMotion: boolean): void {
  if (reducedMotion) return;
  for (const heading of headings) {
    ScrollTrigger.create({
      trigger: heading.closest('section') ?? heading,
      start: 'top 55%',
      once: true,
      onEnter: () => {
        slideUp(lineSpans(heading));
      },
    });
  }
}

/** Cans rise into place: tweens `clock.intro` from 0 to 1 (instantly under reduced motion). */
export function playIntro(clock: { intro: number }, reducedMotion: boolean): void {
  if (reducedMotion) {
    clock.intro = 1;
    return;
  }
  gsap.to(clock, { intro: 1, duration: 2.2, ease: 'power3.out' });
}

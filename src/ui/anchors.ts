/**
 * In-page links (top bar, logo, CTA) glide to a settled moment of their section instead of
 * its first pixel: "#lineup" should land with the cans already in a row, not half way there.
 */
import type { Scroller } from './scroller';
import type { SectionMeter } from './sections';

interface Options {
  meter: SectionMeter;
  scroller: Scroller;
  signal: AbortSignal;
}

export function bindSectionLinks({ meter, scroller, signal }: Options): void {
  document.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
      if (!(link instanceof HTMLAnchorElement)) return;

      const id = link.hash.slice(1);
      const y = meter.landingY(id);
      const section = document.getElementById(id);
      // Anything else (the skip link, unknown ids) keeps the browser's own behaviour.
      if (y === null || !section) return;

      event.preventDefault();
      scroller.scrollTo(y);
      // Move keyboard focus along with the view, like a native anchor jump would.
      section.focus({ preventScroll: true });
    },
    { signal },
  );
}

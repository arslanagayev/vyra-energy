/**
 * Smooth scrolling with Lenis, driven by GSAP's ticker so Lenis, ScrollTrigger and the WebGL
 * frame share one requestAnimationFrame. Reduced motion keeps the browser's own scrolling.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export interface Scroller {
  /** Scrolls the page to `y` pixels: smoothly with Lenis, instantly otherwise. */
  scrollTo(y: number): void;
  destroy(): void;
}

export function createScroller(smooth: boolean): Scroller {
  if (!smooth) {
    return {
      scrollTo: (y) => {
        window.scrollTo({ top: y, behavior: 'instant' });
      },
      destroy: () => undefined,
    };
  }

  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
  lenis.on('scroll', () => {
    ScrollTrigger.update();
  });
  const raf = (time: number): void => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(raf);
  // Lenis already smooths; GSAP's lag compensation would make the two clocks disagree.
  gsap.ticker.lagSmoothing(0);

  return {
    scrollTo: (y) => {
      lenis.scrollTo(y, { duration: 1.6 });
    },
    destroy: () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    },
  };
}

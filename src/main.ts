// Self-hosted variable fonts: no third-party font requests.
import '@fontsource-variable/unbounded';
import '@fontsource-variable/inter-tight';
import 'lenis/dist/lenis.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BRAND, FEATURES, FLAVORS } from './data/flavors';
import { initialState, nearestIndex } from './lib/layout';
import {
  backdropWordOpacity,
  exitOpacity,
  flavorProgress,
  sceneGlow,
  scrollTargets,
} from './lib/scroll';
import { followTargets } from './lib/state';
import type { Stage } from './scene/Stage';
import { supportsWebGL } from './scene/support';
import { bindSectionLinks } from './ui/anchors';
import { renderFeatures, renderSwatches } from './ui/content';
import { requireAll, requireElement, styleWriter } from './ui/dom';
import { createFeatureCallouts } from './ui/features';
import { initFlavorPanel } from './ui/flavorPanel';
import { initHeroPicker } from './ui/heroPicker';
import { loadStage } from './ui/loadStage';
import { playIntro, revealHero, revealOnScroll } from './ui/reveal';
import { createScroller } from './ui/scroller';
import { measureSections } from './ui/sections';

gsap.registerPlugin(ScrollTrigger);
// Mobile URL bars resize the viewport while scrolling; re-measuring then would make cans jump.
ScrollTrigger.config({ ignoreMobileResize: true });

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const lifetime = new AbortController();
const { signal } = lifetime;
const root = document.documentElement;
const canvas = requireElement(document, 'canvas.stage', HTMLCanvasElement);
const hasWebGL = supportsWebGL();
root.classList.toggle('no-webgl', !hasWebGL);

// 1. Text first: everything below is plain DOM and works without WebGL.
const featureItems = renderFeatures(
  requireElement(document, '.features', HTMLOListElement),
  FEATURES,
);
const swatches = renderSwatches(requireElement(document, '.swatches', HTMLElement), FLAVORS);

const scroller = createScroller(!reducedMotion);
const meter = measureSections();
let progress = meter.read();

const hero = initHeroPicker({
  root: requireElement(document, '.picker', HTMLElement),
  flavors: FLAVORS,
  isActive: () => progress.insideIn < 0.5,
  signal,
});
const features = createFeatureCallouts(
  featureItems,
  requireElement(document, '.meter', HTMLElement),
  reducedMotion,
);
const panel = initFlavorPanel({
  card: requireElement(document, '.flavor-card', HTMLElement),
  swatches,
  word: requireElement(document, '.backdrop__word', HTMLElement),
  flavors: FLAVORS,
  reducedMotion,
  onPick: (index) => {
    scroller.scrollTo(meter.scrollY('flavors', flavorProgress(index, hero.center, FLAVORS.length)));
  },
  signal,
});
bindSectionLinks({ meter, scroller, signal });

revealHero(requireElement(document, '#hero', HTMLElement), reducedMotion);
revealOnScroll(requireAll(document, '#lineup .display', HTMLElement), reducedMotion);

// 2. One loop for everything. Scroll and clicks only write targets; the scene eases to them.
const clock = { intro: reducedMotion ? 1 : 0 };
const writeRoot = styleWriter(root);
const exits = [
  { write: styleWriter(requireElement(document, '#hero', HTMLElement)), next: 'insideIn' },
  {
    write: styleWriter(requireElement(document, '#inside .sticky', HTMLElement)),
    next: 'flavorsIn',
  },
  {
    write: styleWriter(requireElement(document, '#flavors .sticky', HTMLElement)),
    next: 'lineupIn',
  },
] as const;
let state = initialState();
let stage: Stage | null = null;

function frame(time: number, deltaMs: number): void {
  // Clamp so a long frame (tab switch, breakpoint) does not teleport the cans.
  const dt = Math.min(deltaMs / 1000, 0.1);
  progress = meter.read();
  const targets = scrollTargets(progress, hero.center, FLAVORS.length);
  if (reducedMotion) {
    // No spin, no easing, no idle bob: the scene simply mirrors the scroll position.
    state = { ...state, ...targets, spin: 0, time: 0 };
  } else {
    state = followTargets(state, targets, dt);
    state.time = time;
  }
  state.intro = clock.intro;

  features.update(reducedMotion ? progress.inside : state.spin);
  panel.show(nearestIndex(state.center, FLAVORS.length));
  panel.setWordOpacity(backdropWordOpacity(progress));
  writeRoot('--glow', sceneGlow(state.center, state.lineup, FLAVORS, BRAND.violet));
  for (const { write, next } of exits) write('opacity', exitOpacity(progress[next]).toFixed(3));

  if (stage) {
    stage.update(state, dt);
    stage.render();
  }
}

let running = false;
function setRunning(run: boolean): void {
  if (run === running) return;
  running = run;
  if (run) gsap.ticker.add(frame);
  else gsap.ticker.remove(frame);
}
setRunning(!document.hidden);
document.addEventListener(
  'visibilitychange',
  () => {
    setRunning(!document.hidden);
  },
  { signal },
);

// 3. three.js (its own chunk) loads after the text, once the label fonts are ready.
const resize = new ResizeObserver(() => {
  stage?.resize(canvas.clientWidth, canvas.clientHeight);
});

if (hasWebGL) {
  void loadStage(canvas, FLAVORS).then((loaded) => {
    if (signal.aborted) {
      loaded?.dispose();
      return;
    }
    if (!loaded) {
      root.classList.add('no-webgl');
      return;
    }
    stage = loaded;
    stage.resize(canvas.clientWidth, canvas.clientHeight);
    resize.observe(canvas);
    root.classList.add('is-ready');
    playIntro(clock, reducedMotion);
  });
}

if (finePointer && !reducedMotion) {
  window.addEventListener(
    'pointermove',
    (event) => {
      stage?.setPointer(
        (event.clientX / window.innerWidth) * 2 - 1,
        1 - (event.clientY / window.innerHeight) * 2,
      );
    },
    { signal, passive: true },
  );
}

// Web fonts change line heights, and with them every section's scroll range.
void document.fonts.ready.then(() => {
  ScrollTrigger.refresh();
});

// Hot module replacement: tear everything down so an edit re-runs this module cleanly.
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    lifetime.abort();
    setRunning(false);
    for (const node of [...featureItems, ...swatches]) node.remove();
    resize.disconnect();
    scroller.destroy();
    for (const trigger of ScrollTrigger.getAll()) trigger.kill();
    stage?.dispose();
    // A disposed renderer loses its context for good; the next run gets a fresh canvas.
    canvas.replaceWith(canvas.cloneNode());
  });
}

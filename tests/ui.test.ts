// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FEATURES, FLAVORS } from '../src/data/flavors';
import { featureWindows } from '../src/lib/scroll';
import { renderFeatures, renderSwatches } from '../src/ui/content';
import { requireAll, requireElement, styleWriter } from '../src/ui/dom';
import { createFeatureCallouts } from '../src/ui/features';
import { initHeroPicker } from '../src/ui/heroPicker';
import { mountPage } from './helpers/page';

let lifetime: AbortController;

beforeEach(() => {
  mountPage();
  lifetime = new AbortController();
});

afterEach(() => {
  lifetime.abort();
  document.body.innerHTML = '';
});

describe('dom helpers', () => {
  it('find elements of the right type or fail loudly', () => {
    expect(requireElement(document, '.picker', HTMLElement).className).toBe('picker');
    expect(() => requireElement(document, '.missing', HTMLElement)).toThrow(/\.missing/u);
    expect(() => requireElement(document, '.picker', HTMLButtonElement)).toThrow();
    expect(requireAll(document, '.picker__arrow', HTMLButtonElement)).toHaveLength(2);
    expect(() => requireAll(document, '.picker *', HTMLButtonElement)).toThrow();
  });

  it('only writes a style property when its value changes', () => {
    const element = document.createElement('div');
    const spy = vi.spyOn(element.style, 'setProperty');
    const write = styleWriter(element);
    write('opacity', '0.5');
    write('opacity', '0.5');
    write('opacity', '1');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(element.style.opacity).toBe('1');
  });
});

describe('renderFeatures', () => {
  it('renders one alternating callout per feature', () => {
    const list = requireElement(document, '.features', HTMLOListElement);
    const items = renderFeatures(list, FEATURES);
    expect(list.children).toHaveLength(FEATURES.length);
    expect(items.map((item) => item.dataset.side)).toEqual(['left', 'right', 'left', 'right']);
    expect(items[1]!.querySelector('h3')?.textContent).toBe(FEATURES[1]!.title);
    expect(items[0]!.querySelector('.feature__num')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('renderSwatches', () => {
  it('renders a named toggle button per flavour', () => {
    const swatches = renderSwatches(requireElement(document, '.swatches', HTMLElement), FLAVORS);
    expect(swatches).toHaveLength(FLAVORS.length);
    swatches.forEach((swatch, i) => {
      expect(swatch.type).toBe('button');
      expect(swatch.getAttribute('aria-pressed')).toBe('false');
      expect(swatch.textContent).toBe(FLAVORS[i]!.name);
      expect(swatch.style.getPropertyValue('--swatch')).toBe(FLAVORS[i]!.can);
    });
  });
});

describe('createFeatureCallouts', () => {
  it('shows one callout at a time and fills the meter', () => {
    const items = renderFeatures(requireElement(document, '.features', HTMLElement), FEATURES);
    const meter = requireElement(document, '.meter', HTMLElement);
    const callouts = createFeatureCallouts(items, meter, false);
    const second = featureWindows(4)[1]!;
    callouts.update((second.from + second.to) / 2);
    expect(items.map((item) => item.style.opacity)).toEqual(['0.000', '1.000', '0.000', '0.000']);
    expect(items[1]!.style.transform).toBe('translate3d(0, 0.0px, 0)');
    expect(items[0]!.style.transform).toBe('translate3d(0, -28.0px, 0)');
    expect(meter.style.getPropertyValue('--progress')).toBe('0.4150');
  });

  it('only fades under reduced motion', () => {
    const items = renderFeatures(requireElement(document, '.features', HTMLElement), FEATURES);
    const callouts = createFeatureCallouts(
      items,
      requireElement(document, '.meter', HTMLElement),
      true,
    );
    callouts.update(0);
    expect(items[0]!.style.transform).toBe('translate3d(0, 0.0px, 0)');
  });
});

describe('initHeroPicker', () => {
  const label = (): string =>
    requireElement(document, '.picker__label', HTMLElement)
      .textContent.replace(/\s+/gu, ' ')
      .trim();

  function setup(active = true) {
    return initHeroPicker({
      root: requireElement(document, '.picker', HTMLElement),
      flavors: FLAVORS,
      isActive: () => active,
      signal: lifetime.signal,
    });
  }

  it('steps through the flavours without wrapping the centre', () => {
    const picker = setup();
    const [previous, next] = requireAll(document, '.picker__arrow', HTMLButtonElement);
    expect(label()).toBe('01 / 05 Original Volt');
    next!.click();
    expect(picker.center).toBe(1);
    expect(label()).toBe('02 / 05 Zero Night');
    previous!.click();
    previous!.click();
    expect(picker.center).toBe(-1);
    expect(label()).toBe('05 / 05 Ice Lilac');
  });

  it('follows the arrow keys only while the hero is on screen', () => {
    let active = true;
    const picker = initHeroPicker({
      root: requireElement(document, '.picker', HTMLElement),
      flavors: FLAVORS,
      isActive: () => active,
      signal: lifetime.signal,
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(picker.center).toBe(1);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', metaKey: true }));
    expect(picker.center).toBe(1);
    active = false;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(picker.center).toBe(1);
  });

  it('stops listening once its lifetime ends', () => {
    const picker = setup();
    lifetime.abort();
    requireAll(document, '.picker__arrow', HTMLButtonElement)[1]!.click();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(picker.center).toBe(0);
  });
});

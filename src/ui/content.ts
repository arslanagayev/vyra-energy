/**
 * Builds the repeated bits of markup from data, so copy and colours live in one place
 * (src/data) and the 3D labels and the HTML can never disagree.
 */
import type { Feature, Flavor } from '../data/flavors';

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** One `li.feature` per feature, alternating left and right of the can. */
export function renderFeatures(list: HTMLElement, features: readonly Feature[]): HTMLLIElement[] {
  return features.map((feature, i) => {
    const item = element('li', 'feature');
    item.dataset.side = i % 2 === 0 ? 'left' : 'right';
    // The <ol> already numbers the items for assistive tech; this is the visual number.
    const number = element('span', 'feature__num', String(i + 1).padStart(2, '0'));
    number.setAttribute('aria-hidden', 'true');
    item.append(number, element('h3', 'feature__title', feature.title));
    item.append(element('p', 'feature__body', feature.body));
    list.append(item);
    return item;
  });
}

/** One toggle button per flavour; the coloured dot is decoration, the name is the label. */
export function renderSwatches(
  container: HTMLElement,
  flavors: readonly Flavor[],
): HTMLButtonElement[] {
  return flavors.map((flavor) => {
    const button = element('button', 'swatch');
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.style.setProperty('--swatch', flavor.can);
    button.style.setProperty('--swatch-accent', flavor.accent);
    const dot = element('span', 'swatch__dot');
    dot.setAttribute('aria-hidden', 'true');
    button.append(dot, element('span', 'swatch__name', flavor.name));
    container.append(button);
    return button;
  });
}

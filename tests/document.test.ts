// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { parsePage } from './helpers/page';

const page = parsePage();
const all = (selector: string): Element[] => Array.from(page.querySelectorAll(selector));

describe('index.html', () => {
  it('declares the language and has exactly one h1', () => {
    expect(page.documentElement.getAttribute('lang')).toBe('en');
    expect(all('h1')).toHaveLength(1);
  });

  it('never repeats an id', () => {
    const ids = all('[id]').map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only references ids that exist', () => {
    const references = [
      ...all('[aria-labelledby]').map((el) => el.getAttribute('aria-labelledby')!),
      ...all('a[href^="#"]').map((el) => el.getAttribute('href')!.slice(1)),
    ];
    expect(references.length).toBeGreaterThan(5);
    for (const id of references) expect(page.getElementById(id), id).not.toBeNull();
  });

  it('gives every button a type and an accessible name', () => {
    for (const button of all('button')) {
      expect(button.getAttribute('type')).toBe('button');
      const name = button.getAttribute('aria-label') ?? button.textContent;
      expect(name.trim()).not.toBe('');
    }
  });

  it('hides decoration from assistive tech', () => {
    expect(page.querySelector('canvas.stage')?.getAttribute('aria-hidden')).toBe('true');
    expect(page.querySelector('.backdrop')?.getAttribute('aria-hidden')).toBe('true');
    for (const svg of all('svg')) expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('labels every section and lets in-page links move focus to it', () => {
    for (const id of ['hero', 'inside', 'flavors', 'lineup']) {
      const section = page.getElementById(id)!;
      expect(section.tagName).toBe('SECTION');
      expect(section.getAttribute('tabindex')).toBe('-1');
      expect(section.getAttribute('aria-labelledby')).toBeTruthy();
    }
  });

  it('starts with a skip link to the main content', () => {
    const first = page.body.querySelector('a');
    expect(first?.className).toBe('skip-link');
    expect(first?.getAttribute('href')).toBe('#main');
  });

  it('says the brand is fictional', () => {
    expect(page.querySelector('footer')?.textContent).toMatch(/not a real product/u);
  });
});

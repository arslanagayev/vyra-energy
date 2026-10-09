import html from '../../index.html?raw';

/** The shipped index.html, parsed. */
export function parsePage(): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

/** Puts the real page body (without its scripts) into the test document. */
export function mountPage(): Document {
  const body = parsePage().body;
  for (const script of body.querySelectorAll('script')) script.remove();
  document.body.innerHTML = body.innerHTML;
  return document;
}

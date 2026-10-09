type ElementClass<T extends Element> = abstract new (...args: never[]) => T;

/** querySelector that fails loudly: a missing element is a markup bug, not a runtime state. */
export function requireElement<T extends Element>(
  root: ParentNode,
  selector: string,
  type: ElementClass<T>,
): T {
  const element = root.querySelector(selector);
  if (!(element instanceof type)) throw new Error(`Missing element: ${selector}`);
  return element;
}

export function requireAll<T extends Element>(
  root: ParentNode,
  selector: string,
  type: ElementClass<T>,
): T[] {
  return Array.from(root.querySelectorAll(selector), (element) => {
    if (!(element instanceof type)) throw new Error(`Unexpected element for ${selector}`);
    return element;
  });
}

/** Writes a style property only when its value changes, so idle frames cause no style work. */
export function styleWriter(element: HTMLElement): (property: string, value: string) => void {
  const last = new Map<string, string>();
  return (property, value) => {
    if (last.get(property) === value) return;
    last.set(property, value);
    element.style.setProperty(property, value);
  };
}

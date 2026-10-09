/**
 * Loads the 3D stage after the text has painted. three.js lives in its own chunk, fetched by
 * the dynamic import below; any failure leaves the page in its no-WebGL state.
 */
import type { Flavor } from '../data/flavors';
import { DISPLAY_FAMILY, TEXT_FAMILY } from '../data/fonts';
import type { Stage } from '../scene/Stage';

/** The can labels are drawn on a 2D canvas, which only uses fonts that are already loaded. */
async function loadLabelFonts(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load(`900 64px "${DISPLAY_FAMILY}"`, 'VYRA'),
      document.fonts.load(`600 32px "${TEXT_FAMILY}"`, 'NUTRITION'),
    ]);
  } catch {
    // A blocked font only changes the label typeface; the fallback stack still prints.
  }
}

export async function loadStage(
  canvas: HTMLCanvasElement,
  flavors: readonly Flavor[],
): Promise<Stage | null> {
  try {
    const [module] = await Promise.all([import('../scene/Stage'), loadLabelFonts()]);
    return new module.Stage(canvas, flavors);
  } catch (error) {
    console.warn('VYRA: the 3D scene could not start, showing the 2D page instead.', error);
    return null;
  }
}

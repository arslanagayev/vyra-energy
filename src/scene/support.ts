/**
 * Feature detection lives apart from Stage.ts so the main chunk can ask "is there WebGL?"
 * without pulling in three.js.
 */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    // Hand the probe context back straight away; browsers cap live contexts per page.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}

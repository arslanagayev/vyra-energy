import { clamp, lerp } from './math';

export interface CameraFrame {
  /** Distance from the stage. */
  z: number;
  /** Camera height. */
  y: number;
  /** Height the camera looks at. */
  lookY: number;
  /** Vertical field of view in degrees. */
  fov: number;
}

/**
 * Frames the stage for any viewport. The arc is about 5.2 units wide, so narrow screens back
 * off and widen the lens a little; the close-up pulls the target up to the can's label.
 */
export function cameraFrame(aspect: number, focus: number): CameraFrame {
  const narrow = clamp((1.3 - aspect) / 0.8); // 0 on desktop, 1 on a tall phone
  const fov = lerp(30, 40, narrow);
  const fit = lerp(1, 1.55, narrow);
  return {
    z: 8.4 * fit,
    y: lerp(1.0, 1.25, narrow),
    lookY: lerp(0.62, 0.78, clamp(focus)),
    fov,
  };
}

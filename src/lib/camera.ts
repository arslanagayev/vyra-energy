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
 * Frames the stage for any viewport and pose.
 *
 * Height: the carousel sits high so the hero copy fits underneath, the close-up centres on
 * the label and the lineup sits lower, under its heading.
 *
 * Distance: on narrow screens the camera widens the lens and backs off. How far depends on
 * the pose: the arc may run off the sides (the neighbours peek in), the close-up comes in
 * nearer, and the lineup backs off furthest so all five cans fit in the row.
 */
export function cameraFrame(aspect: number, focus: number, lineup = 0): CameraFrame {
  const narrow = clamp((1.3 - aspect) / 0.8); // 0 on desktop, 1 on a tall phone
  const f = clamp(focus);
  const l = clamp(lineup);
  const phoneFit = lerp(lerp(1.55, 1.2, f), 2.05, l);
  return {
    z: 8.4 * lerp(1, phoneFit, narrow),
    y: lerp(1.0, 1.25, narrow),
    lookY: lerp(lerp(lerp(0.36, 0.3, narrow), 0.98, f), 0.76, l),
    fov: lerp(30, 40, narrow),
  };
}

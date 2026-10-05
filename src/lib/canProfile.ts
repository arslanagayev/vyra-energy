/**
 * Side profile of a 355 ml can, from the centre of the base to the centre of the lid. It is
 * spun around the Y axis (THREE.LatheGeometry) to make the aluminium body. Units: 1 = ~12 cm.
 */
export interface ProfilePoint {
  /** Distance from the axis. */
  r: number;
  y: number;
}

export const CAN = {
  radius: 0.33,
  height: 1.215,
  /** The printed sleeve covers the straight part of the body. */
  labelBottom: 0.09,
  labelTop: 1.06,
  /** Height of the lid surface, where the pull tab sits. */
  lid: 1.193,
} as const;

export function canProfile(): ProfilePoint[] {
  return [
    // Domed base, pushed up into the can.
    { r: 0, y: 0.04 },
    { r: 0.16, y: 0.03 },
    { r: 0.245, y: 0.006 },
    // Standing ring and the curve up into the wall.
    { r: 0.27, y: 0 },
    { r: 0.3, y: 0.012 },
    { r: 0.322, y: 0.045 },
    { r: CAN.radius, y: CAN.labelBottom },
    // Straight wall under the label.
    { r: CAN.radius, y: CAN.labelTop },
    // Shoulder and neck.
    { r: 0.324, y: 1.095 },
    { r: 0.296, y: 1.15 },
    { r: 0.279, y: 1.18 },
    // Rolled rim, then down into the recessed lid.
    { r: 0.281, y: 1.2 },
    { r: 0.276, y: CAN.height },
    { r: 0.266, y: 1.212 },
    { r: 0.262, y: 1.196 },
    { r: 0.15, y: CAN.lid },
    { r: 0, y: 1.19 },
  ];
}

/** Circumference / height of the printed sleeve: the label texture should have this aspect. */
export const labelAspect = (): number =>
  (2 * Math.PI * CAN.radius) / (CAN.labelTop - CAN.labelBottom);

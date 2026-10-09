import { describe, expect, it } from 'vitest';
import { CAN, canProfile, labelAspect } from '../src/lib/canProfile';

describe('canProfile', () => {
  const points = canProfile();

  it('starts and ends on the axis, so the lathe closes the base and the lid', () => {
    expect(points[0]!.r).toBe(0);
    expect(points.at(-1)!.r).toBe(0);
  });

  it('never exceeds the can radius or its height', () => {
    for (const { r, y } of points) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(CAN.radius);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(CAN.height);
    }
  });

  it('has a straight wall exactly where the label sleeve sits', () => {
    const wall = points.filter((p) => p.r === CAN.radius).map((p) => p.y);
    expect(wall).toEqual([CAN.labelBottom, CAN.labelTop]);
  });

  it('puts the lid below the rim', () => {
    expect(CAN.lid).toBeLessThan(CAN.height);
    expect(CAN.labelTop).toBeLessThan(CAN.lid);
  });
});

describe('labelAspect', () => {
  it('is the unrolled sleeve: circumference over height, about 2.13', () => {
    expect(labelAspect()).toBeCloseTo(2.13, 1);
    expect(labelAspect()).toBeCloseTo(
      (2 * Math.PI * CAN.radius) / (CAN.labelTop - CAN.labelBottom),
      10,
    );
  });
});

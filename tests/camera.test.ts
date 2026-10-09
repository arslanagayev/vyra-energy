import { describe, expect, it } from 'vitest';
import { cameraFrame } from '../src/lib/camera';

const DESKTOP = 1440 / 900;
const PHONE = 390 / 844;

describe('cameraFrame', () => {
  it('backs off and widens the lens on narrow screens', () => {
    const wide = cameraFrame(DESKTOP, 0);
    const narrow = cameraFrame(PHONE, 0);
    expect(narrow.z).toBeGreaterThan(wide.z);
    expect(narrow.fov).toBeGreaterThan(wide.fov);
  });

  it('frames every landscape screen the same way', () => {
    expect(cameraFrame(1.6, 0.3)).toEqual(cameraFrame(2.4, 0.3));
  });

  it('looks up at the label in the close-up and lower for the lineup', () => {
    const carousel = cameraFrame(DESKTOP, 0);
    const closeUp = cameraFrame(DESKTOP, 1);
    const lineup = cameraFrame(DESKTOP, 0, 1);
    expect(closeUp.lookY).toBeGreaterThan(carousel.lookY);
    expect(lineup.lookY).toBeGreaterThan(carousel.lookY);
    expect(lineup.lookY).toBeLessThan(closeUp.lookY);
  });

  it('comes closer for the close-up and backs off for the lineup on phones', () => {
    const carousel = cameraFrame(PHONE, 0).z;
    expect(cameraFrame(PHONE, 1).z).toBeLessThan(carousel);
    expect(cameraFrame(PHONE, 0, 1).z).toBeGreaterThan(carousel);
  });

  it('clamps out-of-range poses', () => {
    expect(cameraFrame(PHONE, 3, -1)).toEqual(cameraFrame(PHONE, 1, 0));
  });
});

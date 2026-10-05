/**
 * Cheap light effects that keep the canvas transparent (no post-processing): a glowing ring
 * with a soft beam above it, and blurred contact shadows. All are additive or alpha sprites
 * drawn from small gradient canvases.
 */
import * as THREE from 'three';

function gradientTexture(
  size: number,
  paint: (ctx: CanvasRenderingContext2D, size: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  paint(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function radialTexture(inner: string, outer: string): THREE.CanvasTexture {
  return gradientTexture(256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/** Vertical fade for the light beam: bright at the bottom, gone at the top. */
function beamTexture(color: string): THREE.CanvasTexture {
  return gradientTexture(128, (ctx, s) => {
    const g = ctx.createLinearGradient(0, s, 0, 0);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgb(0 0 0 / 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

export interface Ring {
  group: THREE.Group;
  setOpacity(opacity: number): void;
  setColor(hex: string): void;
}

export function createRing(color: string): Ring {
  const group = new THREE.Group();
  const tint = new THREE.Color(color);

  const band = new THREE.MeshBasicMaterial({ color: tint, transparent: true, toneMapped: false });
  const torus = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.012, 12, 96), band);
  torus.rotation.x = -Math.PI / 2;
  torus.position.y = 0.004;

  const halo = new THREE.MeshBasicMaterial({
    map: radialTexture('rgb(255 255 255 / 0.9)', 'rgb(255 255 255 / 0)'),
    color: tint,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), halo);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.002;

  const beamMaterial = new THREE.MeshBasicMaterial({
    map: beamTexture('rgb(255 255 255 / 0.32)'),
    color: tint,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.62, 1.5, 64, 1, true),
    beamMaterial,
  );
  beam.position.y = 0.75;

  group.add(glow, torus, beam);
  const base = { band: 1, halo: 0.55, beam: 0.5 };
  return {
    group,
    setOpacity(opacity) {
      band.opacity = base.band * opacity;
      halo.opacity = base.halo * opacity;
      beamMaterial.opacity = base.beam * opacity;
      group.visible = opacity > 0.01;
    },
    setColor(hex) {
      tint.set(hex);
      band.color.copy(tint);
      halo.color.copy(tint);
      beamMaterial.color.copy(tint);
    },
  };
}

export function createShadow(
  texture: THREE.Texture,
): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.001;
  return mesh;
}

export const shadowTexture = (): THREE.CanvasTexture =>
  radialTexture('rgb(4 0 8 / 0.75)', 'rgb(4 0 8 / 0)');

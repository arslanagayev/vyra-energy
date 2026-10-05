/**
 * Prints a can label onto a canvas: the vertical VYRA logo on the front, the flavour name and
 * small print beside it, a nutrition panel and barcode on the back. The canvas wraps once
 * around the can; its horizontal centre faces the camera.
 */
import * as THREE from 'three';
import type { Flavor } from '../data/flavors';
import { labelAspect } from '../lib/canProfile';

export const DISPLAY_FONT = '"Unbounded Variable", "Arial Black", sans-serif';
export const TEXT_FONT = '"Inter Tight Variable", "Helvetica Neue", Arial, sans-serif';

const WIDTH = 2048;
const HEIGHT = Math.round(WIDTH / labelAspect());

/** Draws text rotated -90° (reading bottom to top) centred on (x, y). */
function verticalText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** Largest font size (px) at which `text` fits in `max` pixels. */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  family: string,
  max: number,
  start: number,
): number {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > max && size > 12) {
    size -= 4;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

export function drawLabel(ctx: CanvasRenderingContext2D, flavor: Flavor): void {
  const w = WIDTH;
  const h = HEIGHT;
  const front = w / 2;

  // Base colour with a soft vertical sheen band down the front.
  ctx.fillStyle = flavor.can;
  ctx.fillRect(0, 0, w, h);
  const sheen = ctx.createLinearGradient(front - 520, 0, front + 520, 0);
  sheen.addColorStop(0, 'rgb(255 255 255 / 0)');
  sheen.addColorStop(0.5, 'rgb(255 255 255 / 0.07)');
  sheen.addColorStop(1, 'rgb(255 255 255 / 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  // Speed lines on the sides, in the accent colour.
  ctx.save();
  ctx.strokeStyle = flavor.accent;
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 3;
  for (let i = -8; i < 30; i++) {
    const x = i * 70;
    if (Math.abs(x + h * 0.25 - front) < 420) continue; // keep the logo area clean
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + h * 0.5, 0);
    ctx.stroke();
  }
  ctx.restore();

  // Thin accent bands top and bottom.
  ctx.fillStyle = flavor.accent;
  ctx.fillRect(0, 30, w, 10);
  ctx.fillRect(0, h - 40, w, 10);

  // Front: the big vertical logo.
  ctx.fillStyle = flavor.accent;
  fitFont(ctx, 'VYRA', 900, DISPLAY_FONT, h * 0.84, 360);
  ctx.letterSpacing = '0px';
  verticalText(ctx, 'VYRA', front, h / 2 + 6);

  // Flavour name and "energy" either side of the logo.
  ctx.fillStyle = flavor.ink;
  ctx.letterSpacing = '6px';
  fitFont(ctx, flavor.name.toUpperCase(), 700, DISPLAY_FONT, h * 0.7, 52);
  verticalText(ctx, flavor.name.toUpperCase(), front + 210, h / 2);
  ctx.font = `600 34px ${TEXT_FONT}`;
  ctx.letterSpacing = '14px';
  verticalText(ctx, 'ENERGY · ZERO SUGAR · 355 ML', front - 205, h / 2);

  // Lightning mark above the flavour name.
  ctx.save();
  ctx.translate(front + 210, 120);
  ctx.fillStyle = flavor.accent;
  ctx.beginPath();
  ctx.moveTo(8, -46);
  ctx.lineTo(-22, 6);
  ctx.lineTo(0, 6);
  ctx.lineTo(-10, 46);
  ctx.lineTo(24, -10);
  ctx.lineTo(2, -10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Back: nutrition panel.
  const panelX = 140;
  ctx.letterSpacing = '0px';
  ctx.fillStyle = flavor.ink;
  ctx.font = `800 40px ${TEXT_FONT}`;
  ctx.fillText('NUTRITION', panelX, 150);
  ctx.font = `500 26px ${TEXT_FONT}`;
  ctx.fillText('per 355 ml can', panelX, 190);
  const rows: [string, string][] = [
    ['Energy', `${flavor.kcal} kcal`],
    ['Sugars', '0 g'],
    ['Caffeine', `${flavor.caffeineMg} mg`],
    ['Sodium', '200 mg'],
    ['Vitamin B6', '1.4 mg'],
    ['Vitamin B12', '2.5 µg'],
  ];
  rows.forEach(([key, value], i) => {
    const y = 250 + i * 46;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(panelX, y + 14, 330, 2);
    ctx.globalAlpha = 1;
    ctx.font = `500 26px ${TEXT_FONT}`;
    ctx.fillText(key, panelX, y);
    ctx.textAlign = 'right';
    ctx.fillText(value, panelX + 330, y);
    ctx.textAlign = 'left';
  });
  ctx.font = `500 20px ${TEXT_FONT}`;
  ctx.globalAlpha = 0.7;
  ctx.fillText('Concept product for a design portfolio.', panelX, h - 110);
  ctx.fillText('Not for sale.', panelX, h - 84);
  ctx.globalAlpha = 1;

  // Back: barcode.
  const barX = w - 420;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(barX - 20, h - 300, 290, 190);
  ctx.fillStyle = '#111111';
  let seed = flavor.id.length * 7919;
  for (let x = barX; x < barX + 250;) {
    seed = (seed * 16807) % 2147483647;
    const bar = 2 + (seed % 5);
    ctx.fillRect(x, h - 285, bar, 140);
    x += bar + 2 + (seed % 3);
  }
  ctx.font = `500 22px ${TEXT_FONT}`;
  ctx.fillText('5 060 0' + String(flavor.caffeineMg).padStart(3, '0') + ' 42', barX, h - 122);
}

/** A three.js texture of the label, oriented so the logo faces +Z on the can. */
export function createLabelTexture(flavor: Flavor, maxAnisotropy = 8): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  drawLabel(ctx, flavor);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  // CylinderGeometry starts its UVs at +Z; shift by half so the canvas centre is the front.
  texture.offset.x = 0.5;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

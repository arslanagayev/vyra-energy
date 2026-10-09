/**
 * Where every can is, given the scroll state. Pure functions, no three.js, so the whole
 * choreography is unit-tested. The scene just copies these numbers onto the meshes.
 *
 * Poses:
 *   arc     cans on a shallow arc facing the camera; the centre one rises (hero, flavours)
 *   focus   the centre can comes forward and spins; the rest drop out of frame (what's inside)
 *   lineup  all cans stand in a row, in flavour order (finale)
 */
import {
  circularOffset,
  clamp,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  smoothstep,
  wrap,
} from './math';

export interface CanTransform {
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotZ: number;
  scale: number;
  /** 0 = hidden (wrapping around the back of the carousel), 1 = fully shown. */
  visibility: number;
}

export interface SceneState {
  /** 0..1, cans rise into place when the page loads. */
  intro: number;
  /** Continuous index of the can in the middle of the arc. */
  center: number;
  /** 0..1, close-up of the centre can. */
  focus: number;
  /** 0..1, progress of the close-up spin. */
  spin: number;
  /** 0..1, cans line up in a row. */
  lineup: number;
  /** Seconds since start, for idle motion. */
  time: number;
}

export const LAYOUT = {
  arcRadius: 2.9,
  /** Radians between neighbours on the arc. */
  arcStep: 0.52,
  /** How far the centre can rises. */
  lift: 0.32,
  /** Scale lost per step away from the centre. */
  sideScale: 0.06,
  /** Cans further than this from the centre start to hide... */
  hideFrom: 2.05,
  /** ...and are fully hidden here, so wrapping around the ring is never visible. */
  hideTo: 2.45,
  focusScale: 1.5,
  focusZ: 2.0,
  spinTurns: 1.25,
  lineupSpacing: 1.0,
} as const;

export const initialState = (): SceneState => ({
  intro: 0,
  center: 0,
  focus: 0,
  spin: 0,
  lineup: 0,
  time: 0,
});

/** Index of the can closest to the centre of the arc. */
export const nearestIndex = (center: number, count: number): number =>
  wrap(Math.round(center), count);

export function arcPose(offset: number): CanTransform {
  const angle = offset * LAYOUT.arcStep;
  const distance = Math.abs(offset);
  const hide = smoothstep((distance - LAYOUT.hideFrom) / (LAYOUT.hideTo - LAYOUT.hideFrom));
  return {
    x: Math.sin(angle) * LAYOUT.arcRadius,
    y: LAYOUT.lift * Math.max(0, 1 - distance),
    z: (Math.cos(angle) - 1) * LAYOUT.arcRadius,
    rotY: -angle * 0.6,
    rotZ: 0,
    scale: 1 - Math.min(distance, 2) * LAYOUT.sideScale,
    visibility: 1 - hide,
  };
}

export function focusPose(offset: number, spin: number): CanTransform {
  if (Math.abs(offset) < 0.5) {
    const turn = spin * Math.PI * 2;
    return {
      x: 0,
      y: 0.08,
      z: LAYOUT.focusZ,
      rotY: turn * LAYOUT.spinTurns,
      rotZ: Math.sin(turn) * 0.18,
      scale: LAYOUT.focusScale,
      visibility: 1,
    };
  }
  // Everyone else drops out of frame to the sides.
  const side = Math.sign(offset);
  return {
    x: side * (3.4 + Math.abs(offset)),
    y: -2.8,
    z: -1.5,
    rotY: side * 0.6,
    rotZ: side * -0.3,
    scale: 0.9,
    visibility: 1,
  };
}

export function lineupPose(index: number, count: number): CanTransform {
  const fromMiddle = index - (count - 1) / 2;
  return {
    x: fromMiddle * LAYOUT.lineupSpacing,
    y: 0,
    z: 0.6,
    rotY: 0.35 - fromMiddle * 0.1,
    rotZ: 0,
    scale: 0.95,
    visibility: 1,
  };
}

export function mixPose(a: CanTransform, b: CanTransform, t: number): CanTransform {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
    rotY: lerp(a.rotY, b.rotY, t),
    rotZ: lerp(a.rotZ, b.rotZ, t),
    scale: lerp(a.scale, b.scale, t),
    visibility: lerp(a.visibility, b.visibility, t),
  };
}

/** Lineup progress for one can: they arrive left to right, each easing in. */
export function lineupProgress(lineup: number, index: number, count: number): number {
  const order = count > 1 ? index / (count - 1) : 0;
  return easeInOutCubic(clamp(lineup * 1.5 - order * 0.5));
}

/** Intro progress for one can: the centre can rises first, neighbours follow. */
export function introProgress(intro: number, offset: number): number {
  return easeOutCubic(clamp(intro * 1.4 - Math.abs(offset) * 0.15));
}

export function computeLayout(state: SceneState, count: number): CanTransform[] {
  const focus = easeInOutCubic(state.focus);
  const settle = (1 - state.focus) * (1 - state.lineup);
  const transforms: CanTransform[] = [];

  for (let i = 0; i < count; i++) {
    const offset = circularOffset(i, state.center, count);
    let pose = mixPose(arcPose(offset), focusPose(offset, state.spin), focus);
    pose = mixPose(pose, lineupPose(i, count), lineupProgress(state.lineup, i, count));

    // Idle life: a gentle bob and sway while the cans are just standing there.
    pose.y += Math.sin(state.time * 1.1 + i * 1.7) * 0.025 * settle;
    pose.rotY += Math.sin(state.time * 0.4 + i) * 0.08 * settle;

    // Intro: cans spin up from below the frame.
    const enter = introProgress(state.intro, offset);
    pose.y -= (1 - enter) * 3.2;
    pose.rotY += (1 - enter) * 1.6;
    pose.scale *= lerp(0.8, 1, enter);

    transforms.push(pose);
  }
  return transforms;
}

/** Opacity of the glowing ring under the centre can. */
export const ringOpacity = (state: SceneState): number =>
  clamp(state.intro * 1.2 - 0.2) * (1 - easeInOutCubic(state.focus)) * (1 - state.lineup);

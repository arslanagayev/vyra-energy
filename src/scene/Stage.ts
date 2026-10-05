/**
 * The WebGL stage: renderer, camera, lights and the five cans. It has no idea about scrolling;
 * every frame it receives a SceneState and applies computeLayout() to the meshes.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BRAND, type Flavor } from '../data/flavors';
import { cameraFrame } from '../lib/camera';
import { computeLayout, ringOpacity, type SceneState } from '../lib/layout';
import { clamp, damp, lerp } from '../lib/math';
import { CanFactory, type CanModel } from './can';
import { createRing, createShadow, radialTexture, shadowTexture, type Ring } from './effects';
import { createLabelTexture } from './labelTexture';

export class Stage {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  private readonly factory = new CanFactory();
  private readonly cans: CanModel[];
  private readonly shadows: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[];
  private readonly ring: Ring;
  private readonly dust: THREE.Points;
  private readonly disposables: { dispose(): void }[] = [];
  private readonly pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
  private aspect = 1;

  constructor(canvas: HTMLCanvasElement, flavors: readonly Flavor[]) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Image-based lighting from a procedural studio, so the aluminium has something to reflect.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = environment;
    this.scene.environmentIntensity = 0.85;
    pmrem.dispose();
    this.disposables.push(environment);

    // Key light plus two coloured rim lights in the brand colours.
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(2.5, 4, 5);
    const violet = new THREE.PointLight(0x9b5cff, 34, 0, 2);
    violet.position.set(-3.2, 2.4, -2.2);
    const lime = new THREE.PointLight(0xb6ff00, 20, 0, 2);
    lime.position.set(3.4, 1.2, -2);
    this.scene.add(key, violet, lime, new THREE.AmbientLight(0x2a1433, 0.6));

    const anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const labels = flavors.map((f) => createLabelTexture(f, anisotropy));
    this.disposables.push(...labels);

    const shadowMap = shadowTexture();
    this.disposables.push(shadowMap);
    this.cans = labels.map((label) => {
      const can = this.factory.create(label);
      this.scene.add(can.group);
      return can;
    });
    this.shadows = this.cans.map(() => {
      const shadow = createShadow(shadowMap);
      this.scene.add(shadow);
      return shadow;
    });

    this.ring = createRing(BRAND.lime);
    this.scene.add(this.ring.group);

    this.dust = this.createDust();
    this.scene.add(this.dust);
  }

  private createDust(): THREE.Points {
    const count = 260;
    const positions = new Float32Array(count * 3);
    let seed = 42;
    const rand = (): number => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 12;
      positions[i * 3 + 1] = rand() * 5 - 0.6;
      positions[i * 3 + 2] = (rand() - 0.7) * 7;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const sprite = radialTexture('rgb(255 255 255 / 1)', 'rgb(255 255 255 / 0)');
    const material = new THREE.PointsMaterial({
      size: 0.045,
      map: sprite,
      color: 0xd8ff7a,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.disposables.push(geometry, sprite, material);
    return new THREE.Points(geometry, material);
  }

  resize(width: number, height: number): void {
    this.aspect = width / Math.max(height, 1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
  }

  /** Pointer position in -1..1 for a subtle parallax. */
  setPointer(x: number, y: number): void {
    this.pointer.x = clamp(x, -1, 1);
    this.pointer.y = clamp(y, -1, 1);
  }

  update(state: SceneState, dt: number): void {
    const layout = computeLayout(state, this.cans.length);
    layout.forEach((pose, i) => {
      const can = this.cans[i];
      const shadow = this.shadows[i];
      if (!can || !shadow) return;
      const hidden = 1 - pose.visibility;
      const group = can.group;
      group.visible = pose.visibility > 0.02;
      group.position.set(pose.x, pose.y - hidden * 1.2, pose.z - hidden * 2);
      group.rotation.set(0, pose.rotY, pose.rotZ);
      group.scale.setScalar(pose.scale * lerp(0.6, 1, pose.visibility));

      // Contact shadow on the floor: fades and grows as the can lifts off.
      const height = Math.max(0, pose.y);
      shadow.position.set(pose.x, 0.001, pose.z);
      shadow.scale.setScalar(pose.scale * (1 + height * 0.5));
      shadow.material.opacity =
        0.9 * pose.visibility * clamp(1 - height * 0.9) * clamp(state.intro * 2);
      shadow.visible = shadow.material.opacity > 0.01;
    });

    this.ring.setOpacity(ringOpacity(state));

    // Dust drifts slowly upwards and sways.
    this.dust.rotation.y = state.time * 0.02;
    this.dust.position.y = Math.sin(state.time * 0.3) * 0.08;

    // Camera framing with a damped pointer parallax.
    this.pointer.smoothX = damp(this.pointer.smoothX, this.pointer.x, 3, dt);
    this.pointer.smoothY = damp(this.pointer.smoothY, this.pointer.y, 3, dt);
    const frame = cameraFrame(this.aspect, state.focus);
    if (this.camera.fov !== frame.fov) {
      this.camera.fov = frame.fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.position.set(
      this.pointer.smoothX * 0.35,
      frame.y + this.pointer.smoothY * 0.18,
      frame.z,
    );
    this.camera.lookAt(0, frame.lookY, 0);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.factory.dispose();
    for (const d of this.disposables) d.dispose();
    this.renderer.dispose();
  }
}

/** True when the browser can create a WebGL2 context. */
export function supportsWebGL(): boolean {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

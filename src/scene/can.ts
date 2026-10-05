/**
 * Procedural drink can: an aluminium lathe body, a printed sleeve and a pull tab. Geometry and
 * the metal material are shared; each can only owns its label material.
 */
import * as THREE from 'three';
import { CAN, canProfile } from '../lib/canProfile';

export interface CanModel {
  /** Pivot at the centre of the base. */
  group: THREE.Group;
  setLabel(texture: THREE.Texture): void;
}

function tabShape(): THREE.Shape {
  // Rounded pull tab with a finger hole, drawn flat in the XY plane.
  const w = 0.13;
  const h = 0.22;
  const r = 0.05;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const hole = new THREE.Path();
  hole.absellipse(0, h * 0.18, w * 0.27, h * 0.17, 0, Math.PI * 2, false, 0);
  shape.holes.push(hole);
  return shape;
}

export class CanFactory {
  private readonly body: THREE.LatheGeometry;
  private readonly sleeve: THREE.CylinderGeometry;
  private readonly tab: THREE.ExtrudeGeometry;
  private readonly rivet: THREE.CylinderGeometry;
  readonly metal: THREE.MeshStandardMaterial;
  private readonly labels: THREE.MeshPhysicalMaterial[] = [];

  constructor() {
    const points = canProfile().map((p) => new THREE.Vector2(p.r, p.y));
    this.body = new THREE.LatheGeometry(points, 96);

    const height = CAN.labelTop - CAN.labelBottom;
    this.sleeve = new THREE.CylinderGeometry(
      CAN.radius * 1.003,
      CAN.radius * 1.003,
      height,
      128,
      1,
      true,
    );
    this.sleeve.translate(0, CAN.labelBottom + height / 2, 0);

    this.tab = new THREE.ExtrudeGeometry(tabShape(), {
      depth: 0.008,
      bevelEnabled: true,
      bevelSize: 0.004,
      bevelThickness: 0.003,
      bevelSegments: 2,
      curveSegments: 16,
    });
    this.tab.rotateX(-Math.PI / 2);
    this.tab.translate(0, CAN.lid + 0.006, 0.06);

    this.rivet = new THREE.CylinderGeometry(0.022, 0.026, 0.012, 20);
    this.rivet.translate(0, CAN.lid + 0.01, 0.012);

    this.metal = new THREE.MeshStandardMaterial({
      color: 0xd9d8e2,
      metalness: 1,
      roughness: 0.26,
      side: THREE.DoubleSide,
    });
  }

  create(label: THREE.Texture): CanModel {
    const group = new THREE.Group();
    const labelMaterial = new THREE.MeshPhysicalMaterial({
      map: label,
      metalness: 0.55,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
    });
    this.labels.push(labelMaterial);

    group.add(new THREE.Mesh(this.body, this.metal));
    group.add(new THREE.Mesh(this.sleeve, labelMaterial));
    group.add(new THREE.Mesh(this.tab, this.metal));
    group.add(new THREE.Mesh(this.rivet, this.metal));

    return {
      group,
      setLabel(texture) {
        labelMaterial.map = texture;
        labelMaterial.needsUpdate = true;
      },
    };
  }

  dispose(): void {
    this.body.dispose();
    this.sleeve.dispose();
    this.tab.dispose();
    this.rivet.dispose();
    this.metal.dispose();
    for (const m of this.labels) m.dispose();
  }
}

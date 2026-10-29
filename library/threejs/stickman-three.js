/**
 * stickman-three.js — Three.js orthographic 2D stick figure rig adapter.
 * Uses solve() from rig.js to position 3D line/cylinder segments in an
 * orthographic camera scene.
 */
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { solve, DEFAULTS } from '../js/rig.js';

export class StickmanThree {
  constructor({ color = 0x1c1c1c, height = 320, strokeWidth = 7 } = {}) {
    this.group = new THREE.Group();
    this.height = height;
    this.color = color;
    this.strokeWidth = strokeWidth;

    const lineMat = new THREE.LineBasicMaterial({ color: this.color, linewidth: this.strokeWidth });

    // Lines for spine, arms, legs
    this.spineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.armLGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
    this.armRGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
    this.legLGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
    this.legRGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);

    this.group.add(new THREE.Line(this.spineGeo, lineMat));
    this.group.add(new THREE.Line(this.armLGeo, lineMat));
    this.group.add(new THREE.Line(this.armRGeo, lineMat));
    this.group.add(new THREE.Line(this.legLGeo, lineMat));
    this.group.add(new THREE.Line(this.legRGeo, lineMat));

    // Head circle / mesh
    const headR = (DEFAULTS.headR * this.height) / DEFAULTS.height;
    const headGeo = new THREE.CircleGeometry(headR, 32);
    const headMat = new THREE.MeshBasicMaterial({ color: this.color });
    this.headMesh = new THREE.Mesh(headGeo, headMat);
    this.group.add(this.headMesh);
  }

  update(pose, opts = {}) {
    const s = solve(pose, { height: this.height, ...opts });

    const setPts = (geo, pts) => {
      const v = [];
      pts.forEach(p => v.push(p[0], p[1], 0));
      geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      geo.attributes.position.needsUpdate = true;
    };

    setPts(this.spineGeo, [s.hip, s.neckTop]);
    setPts(this.armLGeo, [s.shoulder, s.elbowL, s.handL]);
    setPts(this.armRGeo, [s.shoulder, s.elbowR, s.handR]);
    setPts(this.legLGeo, [s.hip, s.kneeL, s.footL]);
    setPts(this.legRGeo, [s.hip, s.kneeR, s.footR]);

    this.headMesh.position.set(s.headCenter[0], s.headCenter[1], 0);
  }
}

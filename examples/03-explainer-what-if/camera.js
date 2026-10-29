/**
 * camera.js — pan/zoom/shake/parallax helpers. All return a "camera state"
 * object { x, y, zoom, shake } where x/y is the world point at the center
 * of the viewport (world units) and zoom is a scale factor.
 *
 * A camera state is just data — apply it to a canvas with:
 *   ctx.translate(viewW/2, viewH/2); ctx.scale(cam.zoom, cam.zoom);
 *   ctx.translate(-cam.x, -cam.y);
 *   ctx.translate(shakeOffsetX, shakeOffsetY); // deterministic per frame
 *
 * Parallax layers use the same state: each layer has a `factor` (0..1)
 * that multiplies how much the layer moves relative to the camera. A
 * background layer typically has factor 0.2-0.5, midground 0.7-0.9,
 * foreground 1.0. This is what makes a flat 2D scene read as 3D depth
 * when the camera pans.
 */

import { Easing } from './easing.js';

/**
 * A track of camera keyframes. Mirrors the Timeline API so the whole
 * scene (character + camera) can live in one seek() call.
 */
export class Camera {
  constructor() {
    this.keys = []; // { t, x, y, zoom, shake, ease }
  }

  /**
   * Add a camera keyframe.
   * @param {number} t frame
   * @param {{x?:number,y?:number,zoom?:number,shake?:number}} v
   * @param {Function} [ease]
   */
  add(t, v, ease = Easing.power2InOut) {
    this.keys.push({ t, ...v, ease });
    this.keys.sort((a, b) => a.t - b.t);
    return this;
  }

  /**
   * The camera state at frame t (interpolated).
   * @returns {{x:number,y:number,zoom:number,shake:number,ease:Function}}
   */
  seek(t) {
    const k = this.keys;
    if (k.length === 0) return { x: 0, y: 0, zoom: 1, shake: 0, ease: Easing.linear };
    let i = 0;
    while (i < k.length - 1 && k[i + 1].t <= t) i++;
    const a = k[i], b = k[i + 1];
    const pick = (o, p) => (o[p] !== undefined ? o[p] : 0);
    if (!b || t <= a.t) return { ...a };
    const u = (t - a.t) / Math.max(1e-9, b.t - a.t);
    const e = a.ease(u);
    return {
      x: pick(a, 'x') + (pick(b, 'x') - pick(a, 'x')) * e,
      y: pick(a, 'y') + (pick(b, 'y') - pick(a, 'y')) * e,
      zoom: pick(a, 'zoom') + (pick(b, 'zoom') - pick(a, 'zoom')) * e,
      shake: pick(a, 'shake') + (pick(b, 'shake') - pick(a, 'shake')) * e,
    };
  }

  /**
   * Deterministic shake offset at frame t. Uses a seeded hash of t (NOT
   * Math.random) so seeking to the same frame gives the same pixel — this
   * is what makes the contact sheet reproducible. Amplitude in pixels.
   */
  shakeAt(t, cam) {
    const amp = (cam && cam.shake) || 0;
    if (amp <= 0) return [0, 0];
    // two sines at incommensurate frequencies = cheap, stable noise
    const x = amp * Math.sin(t * 0.73) * Math.cos(t * 0.31);
    const y = amp * Math.sin(t * 0.57 + 1.3) * Math.cos(t * 0.41 + 0.7);
    return [x, y];
  }

  /**
   * Convert a world point to screen space given a camera state and a
   * fixed viewport size. Used by effects.js to position impact FX at a
   * character's hand even as the camera moves.
   * @param {number} wx @param {number} wy
   * @param {Object} cam camera state
   * @param {{w:number,h:number}} view
   * @param {number} [layerFactor=1] parallax factor for this layer
   * @returns {[number, number]}
   */
  toScreen(wx, wy, cam, view, layerFactor = 1) {
    const cx = cam.x !== undefined ? cam.x : 0;
    const cy = cam.y !== undefined ? cam.y : 0;
    const z = cam.zoom || 1;
    const sx = view.w / 2 + (wx - cx) * z * layerFactor;
    const sy = view.h / 2 + (wy - cy) * z * layerFactor;
    return [sx, sy];
  }
}

export default Camera;

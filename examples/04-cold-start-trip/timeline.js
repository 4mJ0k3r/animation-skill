/**
 * timeline.js — a tiny, deterministic keyframe timeline.
 *
 * The single idea that makes code-drawn animation *verifiable*:
 * the entire state of the animation is a pure function of a time value `t`
 * (in frames). There is no wall clock, no requestAnimationFrame dependency
 * for correctness, no Math.random. A capture script can call
 * `tl.seek(frame)` for frame 0, 1, 2, ... N and screenshot — the Nth frame
 * is identical no matter how many times you seek to it.
 *
 * This mirrors what Remotion does internally (each frame is a pure function
 * of useCurrentFrame()) but with no dependencies.
 *
 * Usage:
 *   const tl = new Timeline({ fps: 24, duration: 24 }); // 24 frames = 1s
 *   tl.add('hero.x', 0, 120, 30, 40, Easing.power2InOut);
 *   tl.add('hero.y', [0, 10], [0, 10], 20, 30, Easing.backOut);
 *   const state = tl.seek(12); // -> { 'hero.x': ..., 'hero.y': [..,..] }
 */

import Easing, { spring, cubicBezier } from './easing.js';

function lerpVal(a, b, u) {
  if (Array.isArray(a)) return a.map((v, i) => v + (b[i] - v) * u);
  return a + (b - a) * u;
}

/**
 * @typedef {Object} Track
 * @property {string} key
 * @property {Array<{t:number, v:any, ease?:Function}>} keys
 */

export class Timeline {
  /**
   * @param {{fps?:number, duration?:number}} opts
   */
  constructor({ fps = 24, duration = null } = {}) {
    this.fps = fps;
    this.duration = duration; // in frames; null = open-ended
    /** @type {Map<string, Track>} */
    this.tracks = new Map();
  }

  /**
   * Add a key to a named track. If `v` is null, this is a hold-key marker.
   * @param {string} key  e.g. "hero.x", "hero.pose", "cam.zoom"
   * @param {number} t     frame number (or time in frames)
   * @param {any} v        value at that time (number, [x,y], or object of joint angles)
   * @param {Function} [ease=Easing.linear] easing from THIS key to the NEXT key
   * @param {Function|null} [onEnter=null]  callback called when playhead crosses this key while seeking forward
   */
  add(key, t, v, ease = Easing.linear, onEnter = null) {
    let tr = this.tracks.get(key);
    if (!tr) {
      tr = { key, keys: [] };
      this.tracks.set(key, tr);
    }
    tr.keys.push({ t, v, ease, onEnter });
    tr.keys.sort((a, b) => a.t - b.t);
    return this;
  }

  /** Convenience: add a key with backOut (pop) easing. */
  pop(key, t, v) { return this.add(key, t, v, Easing.backOut); }
  /** Convenience: add a key with power2InOut. */
  smooth(key, t, v) { return this.add(key, t, v, Easing.power2InOut); }
  /** Convenience: add a key with a physical spring (170/26 defaults). */
  spring(key, t, v, stiffness = 170, damping = 26) {
    return this.add(key, t, v, spring(stiffness, damping));
  }
  /** Convenience: add a key using a named cubic-bezier preset. */
  bez(key, t, v, name = 'md3Standard') {
    const ez = cubicBezier(
      name === 'md3Emph' ? 0.05 : 0.2,
      name === 'md3Emph' ? 0.7 : 0,
      name === 'md3Emph' ? 0.1 : 0,
      1
    );
    return this.add(key, t, v, ez);
  }

  /**
   * @param {number} t frame (or time in frames)
   * @returns {Object} state: { [key]: value } — the interpolated value of
   *   every track at time t. Keys with no keyframe before t hold their first
   *   value; keys with no keyframe after t hold their last. Keys with no
   *   keyframes at all are omitted.
   */
  seek(t) {
    const out = {};
    for (const tr of this.tracks.values()) {
      const keys = tr.keys;
      if (keys.length === 0) continue;
      // find bracketing keys
      let i = 0;
      while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
      const a = keys[i];
      const b = keys[i + 1];
      if (!b || t <= a.t) {
        out[tr.key] = a.v;
      } else {
        const u = (t - a.t) / Math.max(1e-9, b.t - a.t);
        out[tr.key] = lerpVal(a.v, b.v, a.ease(u));
      }
    }
    return out;
  }

  /** Values for a single key only (faster if you only need one track). */
  value(key, t) {
    const tr = this.tracks.get(key);
    if (!tr) return undefined;
    const s = this.seek(t);
    return s[key];
  }

  /**
   * Total duration in frames: max of (last key time) across tracks, or the
   * explicit `duration` if set and larger. Use this to size your capture loop.
   */
  get totalFrames() {
    let max = this.duration ?? 0;
    for (const tr of this.tracks.values()) {
      const last = tr.keys[tr.keys.length - 1];
      if (last && last.t > max) max = last.t;
    }
    return max;
  }

  get totalSeconds() { return this.totalFrames / this.fps; }

  /**
   * Build a compact JSON-serializable snapshot of the timeline. Useful for
   * dumping into story.json / a capture config so a capture script can
   * deterministically reconstruct the same timeline from data.
   */
  toJSON() {
    const obj = {};
    for (const [k, tr] of this.tracks) {
      obj[k] = tr.keys.map((k2) => ({ t: k2.t, v: k2.v, ease: k2.ease === Easing.linear ? 'linear' : 'eased' }));
    }
    return { fps: this.fps, duration: this.duration, tracks: obj };
  }
}

export default Timeline;

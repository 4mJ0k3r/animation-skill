/**
 * effects.js — visual FX for code-drawn animation: motion/speed lines,
 * dust puffs, impact bursts, text pop, and screen-flash helpers.
 *
 * Every effect is a PURE function of (t, config) — no Math.random. Where
 * randomness would help (scattered sparks), we seed it: `hash(i)` below
 * is a deterministic pseudo-random in [0,1), so the same frame always
 * produces the same pixels. This is the "seeded rnd(seed, i)" pattern
 * from kelano86/what-if-animation (references/traps.md): "Scatter with
 * rnd(seed, i)".
 */

// Deterministic hash -> [0,1). Cheap, stable, no Math.random.
export function hash(seed, i = 0) {
  let h = (seed * 0x9e3779b1 + i * 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = (h * 0x21f0aaad) >>> 0; h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * Diagonal speed/motion lines behind a moving subject. Classic cartoon
 * "whoosh": 4-6 short parallel strokes trailing opposite the motion
 * direction. Fade the whole set by `fade` (0..1, per-frame alpha).
 *
 * @param {import('./rig.js').CanvasRenderingContext2D} ctx
 * @param {{x:number,y:number}} at  where the effect trails from (e.g. the character's back)
 * @param {{speed:number, dir:[number,number], lines?:number, len?:number, fade?:number}} cfg
 */
export function speedLines(ctx, at, cfg = {}) {
  const n = cfg.lines ?? 5;
  const len = cfg.len ?? 26;
  const fade = cfg.fade ?? 1;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * 7;
    const j = hash(i, 7) * 6 - 3;
    const x1 = at[0] - (cfg.dir?.[0] ?? -1) * len * 0.5 + off * -0.4 + j;
    const y1 = at[1] - (cfg.dir?.[1] ?? 0) * len * 0.5 + off;
    const x2 = x1 - (cfg.dir?.[0] ?? -1) * len;
    const y2 = y1 - (cfg.dir?.[1] ?? 0) * len;
    ctx.lineWidth = 2 + hash(i, 3) * 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Dust puff at a foot-plant or landing: a short expanding, fading ring
 * of 3 arcs. `t` is 0..1 through the effect's lifetime.
 */
export function dust(ctx, at, t = 0.5, { size = 18, color = '#b8b0a4' } = {}) {
  ctx.save();
  ctx.globalAlpha = (1 - t) * 0.6;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const r = size * (0.4 + i * 0.35) * (0.4 + t);
    ctx.lineWidth = 2 - i * 0.5;
    ctx.beginPath();
    ctx.arc(at[0], at[1], r, Math.PI * (1 + i * 0.15), Math.PI * (1.9 - i * 0.15));
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Impact burst: radial star of 8 short lines that pop out over t∈[0,1]
 * and shrink again (so it reads as a 1-frame flash, not a growing blob).
 * Use for hits, lands, and "thwack" moments. Hold it to 2-4 frames.
 */
export function impact(ctx, at, t = 0.5, { color = '#1c1c1c', len = 22 } = {}) {
  const pop = Math.sin(Math.min(1, t * 2.5) * Math.PI * 0.5); // fast out, then fade
  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    const r0 = len * 0.25 * pop + 4;
    const r1 = r0 + len * pop;
    ctx.lineWidth = 3 - i % 2;
    ctx.beginPath();
    ctx.moveTo(at[0] + Math.cos(a) * r0, at[1] + Math.sin(a) * r0);
    ctx.lineTo(at[0] + Math.cos(a) * r1, at[1] + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Text pop: a word that scales up from 0 with a back-out settle, used
 * for captions, onomatopoeia, and title words. `t` is 0..1 for the whole
 * pop (150-300ms). Keep inside safe margins (see references/06).
 */
export function textPop(ctx, text, at, t = 0.5, {
  font = '900 42px system-ui', color = '#1c1c1c', bg = null,
} = {}) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // back-out: the value is > 1 mid-pop, then settles to exactly 1.
  const s = t <= 0 ? 0 : t >= 1 ? 1 : 1 + (t - 1) ** 2 * ((2.70158 + 1) * (t - 1) + 2.70158);
  ctx.translate(at[0], at[1]);
  ctx.scale(s, s);
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(-ctx.measureText(text).width / 2 - 6, -22, ctx.measureText(text).width + 12, 44); }
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/**
 * Full-screen flash (one-frame impact flash, the "life comes from around
 * the character" trick): a white rectangle whose alpha peaks at t=0.5 of a
 * 2-frame flash and is 0 otherwise. Call with t = framesSinceFlash / 2.
 */
export function flash(ctx, w, h, t, color = '#ffffff') {
  if (t <= 0 || t >= 1) return;
  ctx.save();
  ctx.globalAlpha = 0.35 * Math.sin(t * Math.PI);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/**
 * Motion grid: a row of evenly spaced vertical ticks that scrolls left,
 * the "the figure stays put, the world scrolls" locomotion device.
 * `phase` in [0,1) advances the scroll by one tick per cycle.
 */
export function motionGrid(ctx, w, h, phase = 0, { spacing = 44, color = '#00000014' } = {}) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const off = ((phase % 1) + 1) % 1 * spacing;
  for (let x = -off; x < w; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, h * 0.75);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.restore();
}

export default { hash, speedLines, dust, impact, textPop, flash, motionGrid };

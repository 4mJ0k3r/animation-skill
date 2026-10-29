/**
 * easing.js — deterministic easing + spring solver for code-drawn animation.
 *
 * All functions are PURE: ease(t) takes normalized progress t in [0,1] and
 * returns the interpolated value's scale. seek(t) in timeline.js calls these
 * at exact frame times, so there is no wall-clock dependence anywhere.
 *
 * Conventions:
 *  - t in [0, 1] (progress of a segment)
 *  - return value is a multiplier to lerp between two key values
 *
 * Source notes: cubic-bezier values verified against the LottieFiles
 * motion-design-skill reference tables (MIT) and GSAP's built-in ease set.
 * See references/02-timing-easing-tables.md for when to use which.
 */

export const Easing = {
  // Linear — NEVER use for organic/spatial motion. Only for rotation,
  // progress bars, timers, or constant-speed loops.
  linear: (t) => t,

  // Quadratic family — the workhorses. power2 ≈ easeInOutQuad.
  power1In:  (t) => t * t,
  power1Out: (t) => 1 - (1 - t) * (1 - t),
  power1InOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),

  // Cubic — the default for entrances/exits. Matches GSAP power2 / CSS ease-in-out feel.
  power2In:  (t) => t * t * t,
  power2Out: (t) => 1 - Math.pow(1 - t, 3),
  power2InOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),

  // Quartic — heavier deceleration for big moves / dramatic reveals.
  power3In:  (t) => t * t * t * t,
  power3Out: (t) => 1 - Math.pow(1 - t, 4),
  power3InOut: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),

  // Quintic — slow-in for camera moves.
  power4In:  (t) => t ** 5,
  power4Out: (t) => 1 - Math.pow(1 - t, 5),

  // Sine — ambient loops, breathing, idle sway.
  sineIn:  (t) => 1 - Math.cos((t * Math.PI) / 2),
  sineOut: (t) => Math.sin((t * Math.PI) / 2),
  sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Back — overshoot. The (s) parameter is the overshoot amount:
  // s=1.70158 is the classic GSAP back; use 1.2-1.4 for UI entrances,
  // 1.5-2.0 for playful character pops.
  backOut: (t) => {
    const s = 1.70158;
    const p = t - 1;
    return 1 + p * p * ((s + 1) * p + s);
  },
  backIn: (t) => {
    const s = 1.70158;
    return t * t * ((s + 1) * t - s);
  },

  // Elastic — springy landings. period p; default 0.3 gives 1-2 visible wobbles.
  elasticOut: (t) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
  },

  // Bounce — physical impact settle (landing a jump, catching an object).
  bounceOut: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

/**
 * Cubic-bezier evaluator. Takes [x1,y1,x2,y2] and returns ease(t) —
 * the value y at progress t, matching CSS cubic-bezier() semantics.
 *
 * Implementation: Newton-Raphson on the x axis (with a bisection fallback),
 * the same approach browsers use for CSS timing functions. This lets you
 * reuse any published bezier (e.g. MD3 (0.2,0,0,1), Apple HIG (0.25,0.1,0.25,1),
 * Material emphasized (0.05,0.7,0.1,1)) in JS without a lookup table.
 */
export function cubicBezier(x1, y1, x2, y2) {
  const A = (a, b) => 1 - 3 * b + 3 * a;
  const B = (a, b) => 3 * b - 6 * a;
  const C = (a) => 3 * a;
  const calc = (t, a, b) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t;

  const solveX = (x) => {
    // Newton-Raphson, 8 iterations
    let t = x;
    for (let i = 0; i < 8; i++) {
      const xt = calc(t, x1, x2) - x;
      if (Math.abs(xt) < 1e-6) return t;
      const d = (3 * A(x1, x2) * t * t + 2 * B(x1, x2)) * t + C(x1);
      if (Math.abs(d) < 1e-6) break;
      t -= xt / d;
    }
    // bisection fallback
    let lo = 0, hi = 1;
    t = x;
    while (lo < hi) {
      const xt = calc(t, x1, x2);
      if (Math.abs(xt - x) < 1e-6) return t;
      if (xt < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
      if (hi - lo < 1e-6) break;
    }
    return t;
  };

  return (t) => (t <= 0 ? 0 : t >= 1 ? 1 : calc(solveX(t), y1, y2));
}

// Named beziers (from LottieFiles tables + Material/Apple).
export const bez = {
  md3Standard:  cubicBezier(0.2, 0, 0, 1),
  md3Emph:      cubicBezier(0.05, 0.7, 0.1, 1),
  md3Accel:     cubicBezier(0.3, 0, 1, 1),
  md3Decel:     cubicBezier(0, 0, 0, 1),
  appleHig:     cubicBezier(0.25, 0.1, 0.25, 1),
  snappy:       cubicBezier(0.2, 0, 0, 1),
  gentleFloat:  cubicBezier(0.4, 0, 0.2, 1),
  bounceSettle: cubicBezier(0.175, 0.885, 0.32, 1.275),
  elasticSnap:  cubicBezier(0.68, -0.55, 0.265, 1.55),
};

/**
 * Analytic spring solver (spring-physics easing). Returns a function
 * spring(t) where t is normalized [0,1] over a fixed number of oscillations
 * — but the *shape* matches a damped harmonic oscillator:
 *
 *   x(t) = 1 - e^(-zeta*omega*t) * (cos(wd*t) + (zeta*omega/wd)*sin(wd*t))
 *
 * stiffness/damping (in "per second" units, like framer-motion) convert to
 * zeta and omega analytically. For deterministic seeking, you still pass
 * normalized t; the solver just gives you a more physically-true curve
 * than elasticOut when the user picks a specific (stiffness, damping) pair.
 *
 * stiffness: 10-500 (higher = faster)
 * damping:   0-30   (> zeta*2*omega => no oscillation)
 */
export function spring(stiffness = 170, damping = 26) {
  // Normalize spring time so u in [0,1] covers exactly ~4 full periods of
  // the (damped) oscillation — enough to show the overshoot + wobble and
  // still land settled at u=1.
  const omega = Math.sqrt(stiffness);
  const zeta = damping / (2 * omega);
  const wd = omega * Math.sqrt(Math.max(0, 1 - zeta * zeta));
  return (u) => {
    if (u >= 1) return 1;
    if (u <= 0) return 0;
    if (zeta >= 1) return Easing.power2Out(u); // critically/over-damped
    const t = u * (4 * Math.PI / wd); // 4 periods
    const e = Math.exp(-zeta * omega * t);
    return 1 - e * (Math.cos(wd * t) + (zeta * omega / wd) * Math.sin(wd * t));
  };
}

export default Easing;

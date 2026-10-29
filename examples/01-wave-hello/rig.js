/**
 * rig.js — a 2D stickman rig: forward-kinematic joint model + 2-bone IK +
 * a pose-attractor system, drawn to SVG or Canvas.
 *
 * WHY CODE, NOT FRAMES:
 * Every frame, the same function computes every joint's position from named
 * angles. This is the fix for the #1 failure mode of agent-made animation:
 * the character "drifts" — a redrawn stick figure that is a slightly different
 * shape on every shot. Here the figure is one function. You can't drift
 * something you never redraw. (This is exactly how kelano86/what-if-animation
 * keeps one hero across 10+ shots: a `Look` on the one rig.)
 *
 * JOINT MODEL (side view, +x = facing direction, y up = -screen-y):
 *
 *                 head (circle, r = HEAD_R, at neck top)
 *                  |
 *                neck
 *                  |
 *                shoulder
 *                 / \
 *           armL   /   \   armR        (upper + lower, elbow bend)
 *                /     |     \
 *             hand   torso   hand
 *                \     |     /
 *                 \    |    /
 *                hipL  |  hipR
 *                      / \
 *                   /     \
 *                legL      legR       (thigh + shin, knee bend)
 *               knee       knee
 *                 |         |
 *               foot       foot
 *
 * Pose = a record of joint angles (degrees). All poses in
 * references/04-pose-and-motion-library.md are records of these numbers,
 * so any two poses can be interpolated frame-by-frame (that's what
 * timeline.js does for you).
 */

export const JOINTS = [
  'head', 'neck', 'shoulder', 'hip', 'elbowL', 'elbowR', 'kneeL', 'kneeR',
  'handL', 'handR', 'footL', 'footR',
];

// Default proportions in pixels. Standing figure: feet at y=0 (ground),
// hip at y=+70, head top at y=+142. `height` in a rig config scales the
// whole figure by (height / DEFAULT_H).
export const DEFAULTS = {
  headR: 16,       // head circle radius
  neckLen: 10,     // neck to shoulder
  torsoLen: 55,    // shoulder to hip
  upperArm: 28,    // shoulder to elbow
  lowerArm: 28,    // elbow to hand
  thigh: 35,       // hip to knee
  shin: 35,        // knee to foot
  height: 142,     // overall reference height (foot -> head top)
  strokeWidth: 4,  // line weight (keep constant across shots — QA rule)
  color: '#1c1c1c',
};

export const DEFAULT_H = 160;

/**
 * One pose. All angles in DEGREES, measured CCW from "pointing down" for
 * limbs (so 0 = arm straight down, 90 = arm pointing forward/character's +x,
 * -90 = pointing backward). Two angles per limb: a (proximal bone) and
 * b (distal bone, relative to a). `headTilt` tilts the whole head+neck.
 * `face` is a key from references/05-expressions (neutral, happy, sad,
 * surprised, angry, cool, worried, oops, dizzy).
 *
 * @typedef {Object} Pose
 * @property {number} [torso]      forward lean of the spine (deg; + = lean forward toward +x)
 * @property {[number, number]} [armL]  [upper, lower]
 * @property {[number, number]} [armR]
 * @property {[number, number]} [legL]
 * @property {[number, number]} [legR]
 * @property {number} [headTilt]
 * @property {string} [face]
 * @property {number} [bob]         vertical hip offset for gait bounce (px)
 */

/**
 * A named, human-readable pose set. These are the atoms you combine.
 * Coordinates follow the convention above. See references/04 for the full
 * pose + cycle library with keyframe tables.
 */
export const POSES = {
  neutral: {
    face: 'neutral',
    armL: [6, 0], armR: [-6, 0],
    legL: [4, 0], legR: [-4, 0],
    headTilt: 0, torso: 0,
  },
  // One arm up waving (hand high, elbow bent). Facing forward (+a).
  wave: {
    face: 'happy',
    armL: [150, 40], armR: [-6, 0],
    legL: [4, 0], legR: [-4, 0],
    headTilt: 6, torso: -3,
  },
  // Arms out, knees bent — the "I didn't do it" shrug.
  shrug: {
    face: 'neutral',
    armL: [80, 20], armR: [-80, -20],
    legL: [6, 0], legR: [-6, 0],
  },
  // Start of a run: one leg forward, arms pumping.
  runA: {
    face: 'determined',
    torso: 18,
    armL: [120, 50], armR: [-120, -50],
    legL: [55, -20], legR: [-60, 30],
    bob: -2,
  },
  // Surprised: arms up, knees buckled, head tilted back.
  surprised: {
    face: 'surprised',
    torso: -8,
    armL: [100, 40], armR: [-100, -40],
    legL: [14, 15], legR: [-14, -15],
    headTilt: -10,
  },
  // Fallen on the ground: lying on back, knees up. (Root stays at hip
  // height; the figure "falls" by its spine laying down, not by lowering
  // the root — the caller moves the root down to the ground.)
  down: {
    face: 'oops',
    torso: -90,
    armL: [30, -10], armR: [-30, 10],
    legL: [70, -50], legR: [-70, 50],
    headTilt: 25,
  },
};

/**
 * Forward-kinematics solver: given a pose (joint angles), compute every
 * joint's 2D position in the figure's local space.
 *
 * @param {Pose} pose
 * @param {{height?:number, facing?:1|-1}} [opts]
 *   - height: overall figure height (scales all segment lengths).
 *   - facing: 1 faces right (+x), -1 faces left (mirror across the spine).
 * @returns {Object} record: { [joint]: [x, y], headR, footY, hipY, ... }
 */
export function solve(pose = {}, opts = {}) {
  const p = pose || {};
  const face = opts.facing === -1 ? -1 : 1;
  const s = (opts.height ?? DEFAULTS.height) / DEFAULT_H;
  const D = DEFAULTS;
  const L = {
    torso: D.torsoLen * s, neck: D.neckLen * s, headR: D.headR * s,
    upperArm: D.upperArm * s, lowerArm: D.lowerArm * s,
    thigh: D.thigh * s, shin: D.shin * s,
  };

  // Root: hip sits L.thigh + L.shin ABOVE the ground in "local" space, where
  // y=0 is the ground line and y grows UPWARD (so hip.y = thigh+shin for a
  // standing figure, feet land at y≈0). This is the convention the whole
  // solver is written in: `limb()` below measures angles from "straight down"
  // (0° = hang toward the ground), and `drawFigure`/scene code flip this to
  // screen coordinates.
  const hip = [0, L.thigh + L.shin + (p.bob ?? 0) * s];

  // Spine lean. torso=0 -> upright; +torso leans toward the facing direction.
  // BUG FIX (was: shoulder/neckTop/head were all computed with a MINUS
  // cos(...) term, which pushed them BELOW the hip instead of above it —
  // that's what made every leaned/bent pose render with the head at the
  // bottom of the figure instead of the top. The "limb hangs downward"
  // convention used for arms/legs does NOT apply to the spine: the spine
  // always goes UP from the hip regardless of how far it leans.
  const torsoA = (p.torso ?? 0) * (Math.PI / 180);
  const shoulder = [
    hip[0] + Math.sin(torsoA) * L.torso * face,
    hip[1] + Math.cos(torsoA) * L.torso,
  ];
  const neckTop = [
    shoulder[0] + Math.sin(torsoA) * L.neck * face,
    shoulder[1] + Math.cos(torsoA) * L.neck,
  ];
  const headTilt = (p.headTilt ?? 0) * (Math.PI / 180);
  const headCenter = [
    neckTop[0] + Math.sin(torsoA + headTilt) * L.headR * face,
    neckTop[1] + Math.cos(torsoA + headTilt) * L.headR,
  ];

  const limb = (root, a, b, len1, len2, sideSign) => {
    // Angle measured from "straight down": a = 0 -> limb hangs straight down,
    // +a swings toward the sideSign direction (screen-x).
    // BOTH a and b are ABSOLUTE angles from the same "straight down" reference
    // (that's how POSES and references/04 express them — e.g. [4, 0] means the
    // whole limb hangs ~straight down, not "bend the lower bone 0° relative to
    // a 4° upper bone"). Using a+b here was the bug that collapsed bent limbs
    // onto a single vertical line.
    const A = (a * Math.PI) / 180;
    const B = (b * Math.PI) / 180;
    const mid = [
      root[0] + Math.sin(A) * len1 * sideSign,
      root[1] - Math.cos(A) * len1,
    ];
    const end = [
      mid[0] + Math.sin(B) * len2 * sideSign,
      mid[1] - Math.cos(B) * len2,
    ];
    return { mid, end };
  };

  // Side-sign convention: sideSign -1 = left leg/arm, +1 = right.
  // A pose angle a is "forward" positive relative to the character's facing:
  // the facing multiplier (face) flips the sign so the same pose reads the
  // same whether the figure faces left or right.
  const armL = limb(shoulder, face * (p.armL?.[0] ?? 0), face * (p.armL?.[1] ?? 0), L.upperArm, L.lowerArm, -1);
  const armR = limb(shoulder, face * (p.armR?.[0] ?? 0), face * (p.armR?.[1] ?? 0), L.upperArm, L.lowerArm, 1);
  const legL = limb(hip, face * (p.legL?.[0] ?? 0), face * (p.legL?.[1] ?? 0), L.thigh, L.shin, -1);
  const legR = limb(hip, face * (p.legR?.[0] ?? 0), face * (p.legR?.[1] ?? 0), L.thigh, L.shin, 1);

  // Feet planted: for a grounded pose, feet should sit at y ≈ 0.
  const out = {
    hip, shoulder, neckTop, headCenter,
    elbowL: armL.mid, handL: armL.end,
    elbowR: armR.mid, handR: armR.end,
    kneeL: legL.mid, footL: legL.end,
    kneeR: legR.mid, footR: legR.end,
    headR: L.headR,
  };
  return out;
}

/**
 * Two-bone IK solver (law of cosines) — the 10-line solver from
 * ShengyuStudio's stick figure article (verified technique; see
 * references/00-source-index.md). Given a root point, a target point, and two
 * segment lengths, returns the middle joint (knee/elbow). `sign` picks which
 * mirror solution: for knees you want +1 (bend forward), for elbows usually -1.
 *
 * @param {{x:number,y:number}} root
 * @param {{x:number,y:number}} target
 * @param {number} L1 first segment length
 * @param {number} L2 second segment length
 * @param {1|-1} [sign=1]
 * @returns {{x:number,y:number}}
 */
export function ik2(root, target, L1, L2, sign = 1) {
  const dx = target.x - root.x, dy = target.y - root.y;
  let d = Math.hypot(dx, dy);
  d = Math.min(Math.max(d, Math.abs(L1 - L2) + 0.01), L1 + L2 - 0.01); // clamp: never NaN
  const base = Math.atan2(dy, dx);
  const ca = Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
  const a = Math.acos(ca);
  const jointAng = base + sign * a;
  return { x: root.x + Math.cos(jointAng) * L1, y: root.y + Math.sin(jointAng) * L1 };
}

/**
 * Blend two poses into one (linear interpolation of every angle + face
 * swap at t>=0.5). This is what makes walk/run cycles possible: keyframe
 * the pose values, then `blendPose(A, B, t)` between them.
 *
 * @param {Pose} A
 * @param {Pose} B
 * @param {number} t 0..1
 * @returns {Pose}
 */
export function blendPose(A, B, t) {
  const out = {};
  const num = (k) => {
    const a = A[k] ?? 0, b = B[k] ?? 0;
    return typeof a === 'number' ? a + (b - a) * t : k === 'face' ? (t >= 0.5 ? B.face : A.face) : a + (b - a) * t;
  };
  for (const k of ['torso', 'headTilt', 'bob']) out[k] = num(k);
  for (const k of ['armL', 'armR', 'legL', 'legR']) {
    out[k] = [
      (A[k]?.[0] ?? 0) + ((B[k]?.[0] ?? 0) - (A[k]?.[0] ?? 0)) * t,
      (A[k]?.[1] ?? 0) + ((B[k]?.[1] ?? 0) - (A[k]?.[1] ?? 0)) * t,
    ];
  }
  out.face = t >= 0.5 ? (B.face ?? A.face) : (A.face ?? 'neutral');
  return out;
}

/**
 * Procedural walk/run cycle: a single `phase` (0..1) drives everything.
 * Near foot uses `phase`, far foot uses `phase + 0.5`. `gait` blends 0=walk
 * → 1=run (parameters tabled in references/04). This produces believable
 * locomotion without hand-drawn keyframes — the #2 agent failure mode.
 *
 * @param {number} phase 0..1 (mod 1)
 * @param {number} gait 0..1
 * @returns {Pose}
 */
export function walkPose(phase, gait = 0) {
  const p = ((phase % 1) + 1) % 1;
  // Gait parameters: walk (g=0) -> run (g=1)
  const stride = 44 + (60 - 44) * gait;        // px
  const stepH = 15 + (26 - 15) * gait;         // px lift
  const duty = 0.62 + (0.40 - 0.62) * gait;    // stance fraction
  const bobAmp = 5 + (12 - 5) * gait;          // hip bob
  const lean = 10 + 14 * gait;                 // torso forward lean

  // Parameterize stance/swing by a raised-knee arc.
  // Stance (u in [0, duty]): foot is planted; upper angle sweeps from
  // +swing (forward) to -kick (backward) as the foot slides under the hip.
  // Swing (u in [duty, 1]): knee lifts and foot comes around in front.
  const leg = (pph) => {
    pph = ((pph % 1) + 1) % 1;
    let upper, lower;
    if (pph < duty) {
      const u = pph / duty;
      // forward-planted -> backward-kick, knee straightening out
      upper = 28 * (1 - u) - 12 * u; // +28 -> -12
      lower = 55 * (1 - u);          // bent at start of stance, straight at end
    } else {
      const u = (pph - duty) / (1 - duty);
      const sm = u * u * (3 - 2 * u);
      upper = -12 + 40 * sm;          // kick back -> reach forward (+28)
      lower = 35 * Math.sin(Math.PI * u); // knee rises in the middle of the swing
    }
    return [upper, lower];
  };

  const armPhase = p + 0.5; // arms counter-swing: opposite to the same-side leg
  const arm = (pph) => {
    pph = ((pph % 1) + 1) % 1;
    let upper, lower;
    if (pph < 0.5) {
      const u = pph / 0.5;
      upper = 35 * Math.sin(u * Math.PI); // forward at mid-swing
      lower = 12 + 8 * gait;
    } else {
      const u = (pph - 0.5) / 0.5;
      upper = -35 * Math.sin(u * Math.PI); // backward
      lower = 12 + 8 * gait;
    }
    return [upper, lower];
  };

  // Hip rises twice per cycle (once per step). At a run, shift so the peak
  // lands in the flight phase (both feet off the ground).
  const bobPhase = p + (gait > 0.5 ? 0.25 : 0);
  const bob = -Math.abs(Math.sin(bobPhase * Math.PI * 2)) * bobAmp;

  return {
    face: gait > 0.5 ? 'determined' : 'neutral',
    torso: lean,
    bob,
    legL: leg(p),
    legR: leg(p + 0.5),
    armL: [arm(armPhase)[0], arm(armPhase)[1]],
    armR: [arm(p)[0], arm(p)[1]],
  };
}

/**
 * Draw the solved pose to a 2D canvas context. `ctx` must be positioned so
 * that (0,0) = hip, y up. Call `ctx.save(); ctx.translate(hipX, hipY);
 * ctx.scale(1,-1); drawFigure(ctx, pose, opts); ctx.restore();`
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Pose} pose
 * @param {{height?:number, facing?:1|-1, color?:string, strokeWidth?:number}} [opts]
 */
export function drawFigure(ctx, pose, opts = {}) {
  const p = solve(pose, opts);
  const color = opts.color ?? DEFAULTS.color;
  const sw = (opts.strokeWidth ?? DEFAULTS.strokeWidth) * (opts.height ?? DEFAULTS.height) / DEFAULT_H;
  const face = opts.facing === -1 ? -1 : 1;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = sw;

  // Torso
  seg(ctx, p.shoulder, p.hip);
  // Limbs
  seg(ctx, p.shoulder, p.elbowL, p.handL);
  seg(ctx, p.shoulder, p.elbowR, p.handR);
  seg(ctx, p.hip, p.kneeL, p.footL);
  seg(ctx, p.hip, p.kneeR, p.footR);
  // Neck + head
  seg(ctx, p.neckTop, p.shoulder);
  ctx.beginPath();
  ctx.arc(p.headCenter[0], p.headCenter[1], p.headR, 0, Math.PI * 2);
  ctx.stroke();
  // Eyes (facing direction)
  ctx.fillStyle = color;
  const eyeOff = p.headR * 0.35 * face;
  const eyeY = p.headCenter[1];
  ctx.beginPath(); ctx.arc(p.headCenter[0] + eyeOff, eyeY, p.headR * 0.12, 0, Math.PI * 2); ctx.fill();
  // Simple mouth per face
  drawFace(ctx, pose.face, p.headCenter, p.headR, face);
}

function seg(ctx, ...pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}

function drawFace(ctx, face, c, r, faceDir) {
  const ex = faceDir * r * 0.35, ey = c[1] - r * 0.05;
  ctx.lineWidth = Math.max(1, r * 0.08);
  const smile = (w) => { ctx.beginPath(); ctx.arc(c[0] + ex * 0.5, c[1] + r * 0.25, w, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); };
  const frown = (w) => { ctx.beginPath(); ctx.arc(c[0] + ex * 0.5, c[1] + r * 0.45, w, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); };
  const o = (s) => { ctx.beginPath(); ctx.arc(c[0] + ex * 0.5, c[1] + r * 0.3, s, 0, Math.PI * 2); ctx.stroke(); };
  switch (face) {
    case 'happy': smile(r * 0.25); break;
    case 'sad': case 'worried': frown(r * 0.25); break;
    case 'surprised': case 'cool': o(r * 0.18); break;
    case 'oops': o(r * 0.25); break;
    case 'angry': ctx.beginPath(); ctx.moveTo(c[0] + ex - r * 0.3, c[1] + r * 0.35); ctx.lineTo(c[0] + ex + r * 0.3, c[1] + r * 0.25); ctx.stroke(); break;
    default: ctx.beginPath(); ctx.moveTo(c[0] + ex - r * 0.2, c[1] + r * 0.3); ctx.lineTo(c[0] + ex + r * 0.2, c[1] + r * 0.3); ctx.stroke();
  }
}

export default { JOINTS, DEFAULTS, POSES, solve, ik2, blendPose, walkPose, drawFigure };

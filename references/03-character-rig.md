# Character Rig: Stickman Anatomy

This is the single most important file for stopping character drift. The
rule: **the character is a function, not a picture.** Every shot calls the
same `rig.js` to draw the figure, so it cannot drift between shots.

---

## 1. The joint hierarchy

```
                       head (circle, r = headR)
                        |
                       neck
                        |
                      shoulder
                       / \
              armL (2-bone) | armR (2-bone)
                elbowL      elbowR
                 |            |
              handL        handR
                      (spine: shoulder -> hip)
                        |
                         hip
                        / \
               legL (2-bone)| legR (2-bone)
                kneeL      kneeR
                 |            |
              footL        footR
```

**Segment lengths** (from `library/js/rig.js` `DEFAULTS`):

| Segment | Default px | Note |
|---|---|---|
| `headR` | 16 | head circle radius |
| `neckLen` | 10 | neck -> shoulder |
| `torsoLen` | 55 | shoulder -> hip |
| `upperArm` | 28 | shoulder -> elbow |
| `lowerArm` | 28 | elbow -> hand |
| `thigh` | 35 | hip -> knee |
| `shin` | 35 | knee -> foot |
| overall height | ~142 | foot -> head top |

**Total figure height ≈ `neckLen + torsoLen + 2*headR` above the hip +
`thigh + shin` below the hip ≈ 142px at default.** In a 900×400 or
1920×1080 frame, scale via the `height` option on `solve()` /
`drawFigure()`.

**Line weight:** `strokeWidth: 4` default. **Keep this constant across all
shots** — it is a QA checklist item ("consistent line weight"). A 4px line
at 1080p reads as a confident stick figure; 2px reads as a sketch, 8px
reads as a marker.

**Color:** default `#1c1c1c` (near-black, reads as "ink" not "dark grey").
For a colored character, keep the head and torso the same color; you may
use a second color for the head fill only (e.g. a colored head on a dark
body reads as a "mascot").

## 2. Coordinate convention (the one that keeps IK and posing sane)

- The figure's **root is the hip**, at local `(0,0)`.
- **`y` is positive UP** (world convention, not screen convention).
  When drawing to canvas, translate so that the figure's local `y=0`
  (feet) sits at the ground line, and flip the y-axis:
  `ctx.translate(hipX, groundY); ctx.scale(1, -1);` then all figure
  coordinates are used directly.
  *(Note for prone/fallen poses like `POSES.down`: when upright, `hipY = groundY - (thigh + shin) * scale`. When lying flat on the floor with torso at ~90°, translate the hip anchor down to `groundY` plus the torso radius offset so the fallen figure does not float above ground.)*
- **Facing:** `facing: 1` = +x (right), `facing: -1` = -x (left).
  The same pose reads correctly in both directions — you never have to
  mirror coordinates by hand.
- **Angles** are in degrees. For limbs, `0` = hanging straight down,
  `+` = toward the character's facing direction, `-` = opposite.
- Each limb is **two angles**: `[upper, lower]`. `upper` rotates the
  whole limb; `lower` bends the distal bone *relative* to the upper bone
  (so `lower: 0` = straight leg, `lower: 90` = 90° knee bend).

## 3. The Pose record

```js
{
  face: 'neutral',         // one of the keys in references/05
  torso: 0,               // spine lean, + = forward
  headTilt: 0,            // head tilt, + = forward
  armL: [8, 4],          // [upper, lower]
  armR: [-8, -4],
  legL: [4, 0],
  legR: [-4, 0],
  bob: 0,                 // vertical hip offset (gait bounce), in px
}
```

**Every named pose in `references/04` is one of these records.** That is
the whole point: a pose is data, so two poses can be interpolated
frame-by-frame (that's what `timeline.js` + `blendPose()` do) and a
looping walk is just `walkPose(phase)` sampling the same data structure.

## 4. Forward kinematics vs. inverse kinematics (FK vs. IK)

- **FK** (`solve(pose)` in `rig.js`): you specify joint angles, the code
  computes joint positions. Use for *planned, acting poses* — "stand
  with one arm up, head tilted".
- **IK** (`ik2(root, target, L1, L2, sign)` in `rig.js`): you specify
  where a foot/hand *should be*, the code computes the knee/elbow. Use for
  *locomotion* (feet must stay planted on the ground) and *reaching*
  (hand grabs an object).

**Rule (from the ShengyuStudio two-bone-IK article, verified):**
"Use IK where there is a target, FK where there is a rhythm." Walk
cycles are a rhythm (FK/phase-driven), a foot landing exactly on a
particular ground point is a target (IK). The `walkPose` function in
`rig.js` is FK-based (a rhythm) — it produces believable locomotion
without any IK. Use `ik2` when you need a hand to grab a specific
prop or a foot to plant on a specific tile.

## 5. 2-bone IK (law of cosines) — the 10-line solver

```js
function ik2(root, target, L1, L2, sign = 1) {
  let dx = target.x - root.x, dy = target.y - root.y;
  let d = Math.hypot(dx, dy);
  d = Math.min(Math.max(d, Math.abs(L1 - L2) + 0.01), L1 + L2 - 0.01);
  const base = Math.atan2(dy, dx);
  const ca = Math.min(1, Math.max(-1, (L1*L1 + d*d - L2*L2) / (2 * L1 * d)));
  const a = Math.acos(ca);
  const jointAng = base + sign * a;
  return { x: root.x + Math.cos(jointAng) * L1,
           y: root.y + Math.sin(jointAng) * L1 };
}
```

The two clamps (`d` and `ca`) are the whole safety: without them,
`Math.acos` returns `NaN` whenever the target is out of reach, and a NaN
joint silently poisons every subsequent frame. `sign` picks the mirror
solution: `+1` for a knee that bends forward (toward the character's
facing), `-1` for an elbow that bends backward.

## 6. Gait cycle in one phase variable

Walking and running are driven by a single number `phase` in [0,1).
The near foot uses `phase`; the far foot uses `phase + 0.5` (half a
cycle apart, always). A second number `gait` in [0,1] blends from walk
(0) to run (1), and every gait parameter is interpolated by it:

| Parameter | Walk (gait=0) | Run (gait=1) |
|---|---|---|
| Cadence `cyc` (cycles/s) | 1.5 | 2.55 |
| Stride length | 44px | 60px |
| Step height | 15px | 26px |
| Duty factor (stance fraction of cycle) | 0.62 | 0.40 |
| Hip bob amplitude | 5px | 12px |

**The duty factor is the important one.** Above 0.5, both feet are on the
ground for part of the cycle = *walking*. Below 0.5, there is a flight
phase = *running*. Blending `gait` smoothly (ease it toward its target
each frame, or keyframe it over 6-10 frames) means switching walk →
run never pops.

Each foot's path: during the **stance** part (the first `duty` fraction
of its cycle) it slides linearly from +stride/2 (front) to -stride/2
(back), flat on the ground. During the **swing** part it travels forward
again along a smoothstep curve, lifted by a half-sine:

```js
if (pph < duty) {
  const u = pph / duty;
  fx = lerp(stride/2, -stride/2, u);   // sliding back, planted
  fy = groundY;
} else {
  const u = (pph - duty) / (1 - duty);
  fx = lerp(-stride/2, stride/2, smooth(u));  // forward arc
  fy = groundY - stepH * Math.sin(Math.PI * u); // lifted in the middle
}
```

The hip rises and falls twice per cycle (once per step):
`-|sin(phase * 2π)|`. When running, shift the curve so the peak aligns
with the flight phase.

## 7. Foot planting: the "moonwalk bug" fix

If the character stays put on screen and the world scrolls past (the
classic "run in place" scene), the scroll speed must match the foot's
sliding speed or the planted foot slides across the ground — the moonwalk
bug. The fix is one line:

```js
const scroll = stride * cyc / duty;
```

Walk: 44 × 1.5 ÷ 0.62 ≈ 106 units/s. Run: 60 × 2.55 ÷ 0.40 ≈ 383 units/s.
Notice the run is ~3.6× faster even though the stride is only 1.4× longer —
the **shorter duty factor does most of the work**. A common mistake is
`stride × cyc` (forgetting the duty factor), which makes the stance foot
drift.

**For a character that actually moves across the scene** (not scrolling in
place), the scroll speed *is* the character's on-screen speed; just keep
it constant over the whole crossing, and let `walkPose(phase)` where
`phase = t * cyc` drive the gait. Feet then stay planted automatically
because the gait's stride and cadence are matched to the scroll.

## 8. Squash & stretch on a stickman

A stick figure has no volume, so don't scale the whole figure for impact.
Instead, squash at the *legs* (knees tuck, hips drop) — that's the
volume-preserving effect for a limb-based figure. For a landing, hold the
squashed pose 2 frames, then spring back over 4-8 frames. For a jump,
stretch the legs (nearly straight, hips up) for 2-3 frames on the way up.

## 9. Adding a second character

- Use the **same rig instance** (one `rig.js`), just a different
  `facing`, `height`, `color`, and starting position.
- Keep the second character at a *different* `height` (e.g. 0.7× the
  first, for a child/sister) — that's the "scale ≈ 0.7" rule from
  what-if-animation's kit.
- Give them a distinct **color** or **head fill** so they read as
  different people at a glance, even in a silhouette.
- They can share the same pose library; the *acting* (which poses, in
  which order, at which durations) is what differentiates them.

## 10. Adding a new look / costume

A costume is a **set of overrides on the same rig**, not a new rig.
Override `color`, `strokeWidth`, and add 1-3 extra drawing elements
(a hat, a scarf) that attach to existing joints:

```js
drawFigure(ctx, pose, { color: '#33415c', height: 142 });
// extra: a hat, attached to headCenter
const p = solve(pose);
ctx.beginPath();
ctx.arc(p.headCenter[0], p.headCenter[1] - p.headR * 0.5, p.headR * 0.8, Math.PI, 0);
ctx.stroke();
```

Because the hat is computed from the *same* `solve(pose)` call, it can
never drift out of alignment with the head. This is the "one rig, many
looks" pattern from what-if-animation.

## 11. The cast sheet (self-check)

Before you start animating, render one still of *every* character at
*every* named pose you plan to use, side by side (a 3×N contact sheet).
Check:
1. Same proportions in every cell (head:body ratio constant).
2. Same line weight in every cell.
3. Same color in every cell.
4. No pose that makes a limb cross the torso's silhouette badly (a leg
   that should be behind the body is drawn in front = z-order bug).

If any of the four fail, fix the rig or the pose *before* animating.
This is the "character identical across shots" QA rule, made concrete.

# Props & Effects

Props are *objects the character can interact with*. Effects are
*transient marks that sell a moment* (impacts, motion lines, flashes).
Both are code, both are deterministic, and both follow one rule from
what-if's traps: **"a prop near a hand gets read as the hand"** —
keep clear space around every hand, and scale props that enter an
insert shot up hard.

---

## 1. Prop catalogue (the 12 you'll actually use)

Each is an SVG or canvas path in `library/svg/props/`. Placement
coordinates are the stix convention (900×400 working canvas, ground
y=355); all are sized relative to a 142px character:

| Prop | Size | Use | Interaction |
|---|---|---|---|
| `bench` | ~160×40 | rest, sit | character's hips drop to seat height |
| `table` | ~140×80 | food, laptop | objects sit on the top edge |
| `door` | ~90×200 | enter/exit | open/close = rotate on hinge, 20 frames |
| `ball` | r=20 | kick, catch | IK on the hand for a catch (snap) |
| `laptop` | ~100×70 | "thinking" set | screen glow = 0.15 alpha rect |
| `heart` | ~32 | like/love beat | pop 1.2× `backOut`, then drift up 60px and fade |
| `sun` | r=30, #f0c040 | morning scenes | rays = 8 lines rotating 1°/frame (very slow) |
| `cloud` | ~60 | weather | parallax layer, drift 0.5px/frame |
| `tree` | ~200 tall | park set, occluder | leaves = 0.25 alpha canopy blob, sway ±2° at 0.3Hz |
| `pizza` | ~40 | food gag | 4 slices, one can be "lifted" with hand IK |
| `rock` | ~50×30 | the trip beat | static, character's foot collides (see §3) |
| `speech` (label) | text on a tail | the *one* on-screen label allowed | 0.2s pop, 4s hold, 0.2s fade |

Rules:
- Props don't move unless the character moves them. A floating bench
  (vibrating 2px) reads as a glitch, not wind. (stix QC: "no
  animation freezes" applies to characters, but a prop that *moves on
  its own* is worse.)
- A prop being *thrown* follows an arc (add 10-20px perpendicular
  offset at the apex — `references/01` §7), and its spin is 360° over
  the flight, linear (the ONLY place linear spin is allowed).
- Every prop that sits on a surface gets a contact shadow (ellipse,
  0.15 alpha, `references/06` §3).

## 2. Effects (transient marks)

All in `library/js/effects.js`. Durations in frames @30fps.

| Effect | Duration | When | How |
|---|---|---|---|
| **Impact flash** | 1 frame at full, 35% next frame | any hit/landing | `effects.js flash()` |
| **Impact burst** (radial star) | 4-6 frames | hard impact | `impact()` |
| **Dust puff** | 8-12 frames | foot plant, landing | `dust()` |
| **Speed lines** | while moving, 200-400ms | run, fast turn | `speedLines()` |
| **Motion grid** (scrolling ticks) | whole run-in-place scene | locomotion with static character | `motionGrid()` + the moonwalk fix from `references/03` §7 |
| **Text pop** | 150-300ms | title words, onomatopoeia | `textPop()` with `backOut` |
| **Screen shake** | 2-4 frames, 2-6px | hard impact only | `camera.shakeAt()` |
| **One-frame flash on impact** | 1 frame | the "life comes from around them" trick | white rect at 0.35 alpha |

The what-if rule: **"Life comes from around the character"** — in a
hold beat, something moves (dust, a sway, a slow push-in, a flicker
in the lamp). A hold with *zero* motion for 1s+ is a dead frame.

## 3. Collision (the "trips over a rock" beat, concretely)

This is the example prompt in the pipeline spec, so the mechanics here
are the mechanics the cold-start test will need:

1. **The trip moment**: the character's *front foot* (the one
   planted at the "down" beat) reaches x = rock.x - rock.w/2. At
   that frame, the foot does NOT plant on the ground — it plants on
   the rock's top surface (raise `fy` by rock.h for 2 frames).
2. **The stagger**: 2-4 frames later, the *other* foot's swing
   misses the ground (its arc apex is too high by 10px) and the
   character's center of mass passes in front of the hip.
3. **The fall**: `torso` rotates 90° toward the ground over 10-12
   frames, `power2In` (gravity), head keeps its face on the camera
   (the "face follows the camera" rule — the head counter-rotates
   180° so it's not upside-down for 2 frames longer than needed).
4. **The impact**: hands + hip hit ground same frame: 1-frame flash
   + `dust()` at both hands + `shake: 4px` for 3 frames + face
   'oops' swap on the impact frame (the face changes ON the impact,
   not before it).
5. **The hold**: 8-12 frames lying (`POSES.down`), face 'oops'
   settling to 'worried', one slow blink.
6. **Recovery**: `references/04` §2 get-up sequence, 600-800ms,
   `power2Out` throughout.

The whole beat is ~1.2-1.8s. That's one scene at 8fps... it's 4-5
scenes' worth at 30fps — budget for it.

## 4. Kinetic typography (on-screen text motion)

From iart-ai/kinetic-typography-skills (MIT, verified): the recipes
that work for stickman clips:

| Recipe | How | Timing |
|---|---|---|
| Word-by-word reveal | each word: `translateY(40px)→0` + opacity 0→1, 80ms stagger | 300-500ms total for 4-5 words |
| Line-by-line | `clip-path: inset(0 100% 0 0) → inset(0)` on each line, 60-100ms stagger | 400-800ms total |
| Pop | scale 0.6→1.0 `backOut` + opacity, 200ms | single word emphasis |
| Tracking-in | `letter-spacing: 0.3em → -0.02em` over 400ms | title cards |

Rules (from that skill's SKILL.md, MIT): line-height 1.1-1.2 for
display type, 1.4-1.6 for body; total reveal capped ~800ms (anything
longer, the viewer has stopped watching the text and started watching
the motion); one reveal technique per card (don't mix pop + line-wipe
on the same headline). For canvas rendering: draw text after
`ctx.font = '900 64px system-ui'`, and **check the frame at
`document.fonts.ready`** (or use a system font stack — the font
loading trap is in `references/12`).

## 5. Particles (dust, sparks, confetti)

`effects.js` ships `dust()`; particles beyond that are the same
pattern: N particles, each with a seeded trajectory (no
`Math.random` — use `hash(seed, i)`), an origin, and a per-frame
velocity + gravity:

```js
// confetti on a celebration beat: 12 particles, 60 frames
for (let i = 0; i < 12; i++) {
  const vx = (hash(seed, i) - 0.5) * 6;   // seeded, deterministic
  const vy = -3 - hash(seed, i + 50) * 4;
  const x = origin[0] + vx * frame + 0.1 * frame * frame * 0; // horizontal
  const y = origin[1] + vy * frame + 0.15 * frame * frame;    // gravity
  drawRect(ctx, x, y, 4, 6, i % 2 ? '#e85c5c' : '#f0c040');
}
```

Cap particles at 20-40 per effect; more reads as noise, not
celebration. (The "less than 20 animated elements per viewport" rule
from LottieFiles' performance section — for a stickman clip,
*particles count toward that budget*.)

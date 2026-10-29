# Timing & Easing Tables

Every duration in this document is in **milliseconds** at the project's
chosen FPS. Convert to frames with `frames = round(ms / 1000 * fps)`. The
`library/js/timeline.js` `add()` calls take frame numbers, so use the frame
column, not the ms column, when writing code.

All numbers below are cross-checked against the LottieFiles
motion-design-skill `reference/timing-easing-tables.md` (MIT, verified
against the repo) and our library's own `Easing` set. Where our numbers
differ, this document's numbers win and the difference is called out.

---

## 1. Duration by motion type

| Motion | Duration | Frames @24 | Frames @30 | Frames @60 |
|---|---|---|---|---|
| Micro-feedback (hover, tooltip in) | 80-120ms | 2-3 | 2-4 | 5-7 |
| Button press / toggle | 120-180ms | 3-4 | 4-5 | 7-11 |
| Icon / small-prop transition | 150-250ms | 4-6 | 5-8 | 9-15 |
| Card / medium character move in | 200-350ms | 5-8 | 6-11 | 12-21 |
| Modal / big entrance | 300-400ms | 7-10 | 9-12 | 18-24 |
| Page / scene transition | 400-600ms | 10-14 | 12-18 | 24-36 |
| Dramatic reveal (hero entrance) | 600-1200ms | 14-29 | 18-36 | 36-72 |
| Ambient loop (idle breathing, sway) | 2000-8000ms | 48-192 | 60-240 | 120-480 |
| **Character walk cycle (one step)** | **400-500ms/step** | **10-12** | **12-15** | **24-30** |
| **Character run cycle (one step)** | **280-320ms/step** | **7-8** | **8-10** | **17-19** |

The walk/run cycle rows are ours (not in the LottieFiles tables, which are
UI-oriented). They match the `walkPose` gait parameters in `rig.js`:
cadence 1.5 cycles/s (walk) = 667ms per full cycle = 333ms per step at
30fps ≈ 10 frames; run 2.55 cycles/s = 392ms/cycle ≈ 13 frames per step.
Adjust the cycle length to taste but **keep it the same for the whole
scene** — a character whose step rate changes mid-scene reads as a jump cut.

## 2. Distance scales duration

LottieFiles rule: 50px=0.8×, 100px=1.0×, 200px=1.3×, 300px=1.5×,
400px=1.6×, full-screen=1.8-2.0×. Applied to a character crossing a scene:

- Short hop (50-100px): base duration
- Cross the stage (200-400px): 1.3-1.6× base
- Full-screen traverse: 1.8-2.0× base, and add a mid keyframe (see
  `references/01` rule #7 Arcs) — the LottieFiles "1/3 rule" says no
  unbroken motion should travel more than 1/3 of the frame; for a
  character crossing the whole scene, break the move into 3 sub-moves,
  each ≤1/3 of the scene, with a brief settle between.

## 3. Enter vs. exit

Entrance = base duration (100%). Exit = 65-75% of entrance. A character
staying on screen longer than they arrived is the natural reading; a long
exit + short arrival reads as "they teleported in".

## 4. Interactive feedback (UI, not character)

| Interaction | Max latency |
|---|---|
| Hover | <100ms |
| Press/tap | <150ms |
| Release/settle | 200-300ms |
| Error shake | 300-400ms (2-3 oscillations) |
| Long press | 500-800ms |
| Drag start | <50ms |

These apply when the animation is *reactive* (a website, not a rendered
clip). For a rendered MP4/GIF there is no interactivity — skip this table.

## 5. Easing: directional rules (the four you use 90% of the time)

| Situation | Easing |
|---|---|
| Entrance (something arriving) | **ease-out** — `Easing.power2Out`, `Easing.power3Out` |
| Exit (something leaving) | **ease-in** — `Easing.power2In` |
| On-screen move (position across frame) | **ease-in-out** — `Easing.power2InOut` |
| Looping ambient (idle, breathing, sway) | **sine** — `Easing.sineInOut` |
| Constant-speed thing (a scroll, a timer bar) | **linear** — the ONLY place `Easing.linear` is allowed |

## 6. Easing: cubic-bezier presets (verified from LottieFiles tables)

| Name | Bezier | Use |
|---|---|---|
| MD3 Standard | (0.2, 0, 0, 1) | Default on-screen move |
| MD3 Emphasized | (0.05, 0.7, 0.1, 1) | Entrances with a soft, long tail |
| MD3 Accelerate | (0.3, 0, 1, 1) | Exits |
| MD3 Decelerate | (0, 0, 0, 1) | Anything arriving |
| Apple HIG | (0.25, 0.1, 0.25, 1) | iOS-style default |
| Snappy UI | (0.2, 0, 0, 1) | Fast, decisive |
| Gentle float | (0.4, 0, 0.2, 1) | Ambient, calm |
| Bounce settle | (0.175, 0.885, 0.32, 1.275) | Playful, one wobble |
| Elastic snap | (0.68, -0.55, 0.265, 1.55) | Dramatic overshoot |

All are available in `library/js/easing.js` via `Easing.bez` (e.g.
`bez.gentleFloat(t)`) and the `Timeline.bez(key, t, v, 'gentleFloat')`
helper. `cubicBezier(x1, y1, x2, y2)` in the same file lets you build your
own.

## 7. Easing: GSAP-style named curves

If you use the GSAP template (`templates/gsap-timeline.html`), the same
families exist as GSAP named eases: `power1.out` (quad out),
`power2.out` (cubic out — our default for entrances), `power3.out`
(quartic out), `back.out(1.7)`, `elastic.out(1, 0.3)`, `sine.inOut`,
`"none"` (linear). The JS library's `Easing` names map 1:1 to these.

## 8. Spring parameters (for `spring(stiffness, damping)`)

| Feel | Stiffness | Damping | Use |
|---|---|---|---|
| Very stiff (metal, rigid) | 400+ | 25-30 | Heavy object snap |
| Standard | 250-350 | 18-24 | Default character settle |
| Bouncy | 150-250 | 10-15 | Playful landing |
| Very bouncy | 100-200 | 5-10 | Cartoon impact |
| Gentle | 100-150 | 20-25 | Idle bob, breathing |

`damping < 2·√stiffness` (zeta < 1) = under-damped, it wobbles;
`damping = 2·√stiffness` = critically damped, fastest no-overshoot settle;
higher = over-damped, slow and heavy.

## 9. Stagger patterns

| Pattern | Delay between elements | Total budget |
|---|---|---|
| Micro cascade (list items) | 20-40ms | <200ms |
| Standard (cards, panels) | 50-100ms | <400ms |
| Dramatic (hero sequence) | 100-200ms | <600ms |
| Wave (data points) | 30-60ms | <500ms |

**Total stagger across all elements MUST stay <500ms.** If you have 6
elements staggered at 80ms each, the last one starts at 400ms — that's
fine; at 100ms each it's 500ms, right at the edge; 120ms each = 600ms,
violates the rule. Stagger direction: top-to-bottom for lists, left-to-right
for horizontal layouts, center-out for a hero reveal, reverse for exits.

## 10. Overshoot budget

| Context | Max overshoot |
|---|---|
| Success confirmation | 5-10% |
| Error (shake) | 0% (error never celebrates) |
| General UI feedback | 2-5% |
| Celebration | 15-25% |
| Premium / corporate | 0% |

For character acting: a surprised character's head-tilt can overshoot
10-15° past its target (reads as "startled"), a calm character's head
tilt should not overshoot at all.

## 11. Material-based easing (when an object moves, not just the character)

| Material | Duration scale | Overshoot |
|---|---|---|
| Rigid (metal) | 1.2× | 0% |
| Elastic (rubber) | 0.8× | 15-25% |
| Fluid (water) | 1.5× | 5% |
| Paper (card) | 1.0× | 3-5% |
| Gas (smoke) | 2.0× | 0% |
| Glass | 0.9× | 0% |

Apply the duration scale to the *object's* move, not the character's. A
paper bag that gets thrown moves slower and with more wobble than a metal
ball the character catches.

## 12. Choosing which easing for which action (the 60-second decision)

1. Is it a **character acting**? → `power2InOut` for position,
   `backOut` for anything that should "pop" (a gasp, a surprise),
   `power2Out` for settling.
2. Is it a **loop**? → `sineInOut`, nothing else. Loops must be
   symmetric — ease-out only reads as a one-way move.
3. Is it **fast and urgent**? → shorter duration, `power3Out` (harder
   decel = more impact feel).
4. Is it **calm / ambient**? → `sineInOut` at 2000-8000ms, small
   amplitude.
5. Is it an **exit**? → `power2In` (accelerating away), 65-75% of the
   entrance duration.
6. Default to nothing exotic. `power2InOut` at 200-400ms is the
   "I'm not sure, make it good" answer.

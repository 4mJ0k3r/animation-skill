# Pose & Motion Library

Every entry is a **Pose record** (see `references/03-character-rig.md` §3):
a set of joint angles, not a picture. Keyframe these in `timeline.js`,
blend them with `blendPose()`, or feed them to `walkPose()` as loop
extremes. `library/js/rig.js` ships `POSES` with the six most-used
entries; the rest below are the numbers to add yourself — they follow the
exact same record shape.

All angles in degrees: `0` = limb straight down; `+` = toward the
character's facing; `-` = away. Limbs are `[upper, lower]` where
`lower` bends the distal bone *relative* to the upper bone.

> Conventions checked against: stix's `library/poses.md` (hip-at-origin
> SVG coords, MIT — we convert that into angles) and the ShengyuStudio
> two-bone-IK gait article (gait table in §1 below).

---

## 1. Walk cycle — keyframe table

One full cycle = left leg forward + right leg forward + back to start.
Four beats per leg, repeated. Use **4-6 frames per beat** at 30fps
(16-24 frames total per cycle at 30fps ≈ the 0.5s sub-loop stix uses).

Beat names: **contact** (foot plants), **down** (weight passes over the
planting foot), **passing** (legs cross the midline, hip highest), **up**
(toe-off / swing). Both legs are half a cycle apart.

| Beat | t (cycle fraction) | legF (fwd, [upper, lower]) | legB (back, [upper, lower]) | armF ([upper, lower]) | armB | torso | bob |
|---|---|---|---|---|---|---|---|
| Contact L | 0.00 | [30, 0] | [−25, 30] | [−25, 15] | [25, −15] | 4° fwd | −2 |
| Down L | 0.25 | [15, 5] | [−10, 45] | [−15, 15] | [15, −15] | 4° | 0 |
| Passing | 0.50 | [0, 0] | [10, 60] | [0, 10] | [0, −10] | 0° | +2 (hip highest) |
| Up L | 0.75 | [−15, 30] | [15, 25] | [10, 15] | [−10, −15] | 4° | 0 |
| Contact R | 1.00 | (mirror of 0.00) | — | — | — | — | — |

Rules that make it read as a walk (and the 3 most common failures):

1. **Arms counter-swing.** The arm on the *same side* as the back leg
   swings forward. If both arms swing with the legs, it looks like
   waddling. (stix's `walk_cycle` CSS does exactly this: `.walk-arm-l`
   mirrors `.walk-leg-r` phase.)
2. **Feet don't skate.** During the *stance* beat, the foot's x-position
   must not move relative to the ground. If the character moves across
   screen while the "planted" foot slides, apply the moonwalk fix:
   `scroll = stride × cadence ÷ duty` (`references/03` §7).
3. **Hip bobs twice per cycle.** One dip per step. Skip the bob and it
   looks like the figure is gliding on rails.
4. **Knees don't bend backward past ~60°** (lower-leg angle > 60° reads
   as a hyperextended/locked knee failure — QA item "no joint
   hyperextension").
5. **Forward lean ~4-8°** for walk, 15-20° for run. No lean at all =
   stiff; 30°+ = looks like falling.

**Run cycle**: same table, wider amplitudes (stride +40%, lean 15-20°,
knee-bend up to 90°, flight phase between beats where *both* feet are
off the ground — that flight is the entire visual difference between
walk and run). Use `walkPose(phase, gait=1)` from `rig.js`.

**Crawl/fall**: legs [40, 60] both, torso −30° (leaning back), arms
scrunched under chest; head keeps face on camera. See `POSES.down` in
`rig.js` for the "on the ground" resting state.

## 2. Named pose catalogue

Each pose: when to use + the full record. `face` keys are defined in
`references/05-expressions-and-acting.md`.

### idle / neutral
Relaxed stand, weight slightly on one leg. Use for any "just standing"
beat. Add a `sin(t)` bob of 1-2px on `bob` at 0.5Hz for life.
```js
{ face:'neutral', torso:0, headTilt:0,
  armL:[6,0], armR:[-6,0], legL:[4,0], legR:[-4,0] }
```

### watch / alert
One arm across the eyes, head down. The "looking into the distance"
pose.
```js
{ face:'neutral', torso:-3, headTilt:-14,
  armL:[70,40], armR:[-6,0], legL:[4,0], legR:[-4,0] }
```

### point (right)
Right arm extended forward-up, head follows the point.
```js
{ face:'determined', torso:4, headTilt:10,
  armL:[6,0], armR:[110,-10], legL:[4,0], legR:[-4,0] }
```

### reach / grab
Arm extended horizontally, slight lean into it; *use IK on the hand*
to snap it exactly onto the prop (`ik2` with the prop's handle as
target). Without the snap, hands miss objects — QA item #2.
```js
{ face:'determined', torso:10,
  armL:[6,0], armR:[150,0], legL:[6,0], legR:[-6,0] }
```

### throw
Wind-up (arm back, opposite shoulder raised) → release (arm forward,
slight overshoot `backOut`), then the *prop* follows an arc while the
character holds the follow-through pose 4-6 frames.
```js
// wind-up
{ face:'determined', torso:-12, armL:[-120,30], armR:[6,0], legL:[10,0], legR:[-20,20] }
// release
{ face:'determined', torso:14, armL:[130,0], armR:[-40,-20], legL:[-6,0], legR:[16,10] }
```

### jump
Anticipation crouch (knees 50°, arms back) 4-6 frames → launch (legs
extend, body up, arms overhead) → airborne peak → land (anticipate the
landing one beat early: slight crouch before feet touch) → squash 2
frames → settle. Durations: crouch 200ms, launch 250ms, air 300-400ms,
land 150ms.
```js
// crouch
{ face:'determined', torso:18, armL:[-30,20], armR:[-30,-20], legL:[40,70], legR:[40,70], bob:-6 }
// peak
{ face:'neutral', torso:0, armL:[160,20], armR:[-160,-20], legL:[-10,30], legR:[10,30], bob:+14 }
```

### sit
Hips drop to bench level (hips go from ground to `−40px`), thighs
horizontal [0, 0], shins down [0, 0], back straight. One-shot: 300ms
ease-out. `sit_down`/`stand_up` in stix's `transitions.md` use
translateY on the hips — same thing.
```js
{ face:'neutral', torso:-4, armL:[20,0], armR:[-20,0], legL:[0,90], legR:[0,90] } // hips lowered by scene placement
```

### wave
One arm overhead, elbow bent; hand oscillates ±12° at ~2Hz (8 frames
period at 30fps) for the whole "waving" duration. Head tilts toward the
waving side. `face:'happy'`.
```js
{ face:'happy', torso:-2, headTilt:8,
  armL:[150,40], armR:[-6,0], legL:[4,0], legR:[-4,0] }
```

### dance_a / dance_b
Mirror hip-sway beats: hips ±6px, knees alternating [25,40], arms in
opposite-up positions. 8 frames each, alternating = a two-beat shimmy.
(See stix `poses.md` `dancing_a/b` for the SVG-coord version.)

### surprise
The "trips over a rock" beat. Eyes wide, arms whip up *with a
whiplash* (fast `power3Out` on the arm angle, 8-10 frames), knees
buckle slightly, head tilts back. Hold 8-12 frames — the hold IS the
comedy.
```js
{ face:'surprised', torso:-8, headTilt:-12,
  armL:[110,50], armR:[-110,-50], legL:[12,20], legR:[-12,-20] }
```

### trip / fall
Sequence, not one pose: (1) stumble — front leg [50, 10] forward past
the body, arms flailing both outward [±140, 0]; (2) top-over — torso
rotates 90° toward the ground over 10-12 frames with `power2In`
(accelerating, gravity); (3) impact — squash at the legs, dust at the
hands; (4) sprawl — `POSES.down`-like, face 'oops', one arm behind.
Total ~1.0-1.5s. **Gravity = ease-in; falling is never ease-out.**

### get up
The reverse of trip: (1) push-up — one arm plants (IK to ground),
chest up 20°; (2) knee-up — both legs [40, 80] driving the hips up;
(3) stand — neutral pose, `bob` dip 2px on the landing, face
'neutral'→'worried'→'neutral'. 600-800ms. Use `power2Out` throughout —
recovery is deliberate, not panicked.

### think
Weight on back leg, one hand to the chin (IK: hand target = head
front-bottom), head down 10°, eyes look up-and-away (see
`references/05` for eye direction). 2s+ of this reads as "thinking".
```js
{ face:'neutral', torso:6, headTilt:-8,
  armL:[80,120], armR:[-4,0], legL:[8,0], legR:[-14,0] }
```

### run (extremes for `walkPose` keyframing)
If you keyframe instead of using `walkPose(phase, 1)`: front leg
[65, −20] / back leg [−70, 40], torso 18°, arms [±140, ±40] pumping,
bob −12 at flight peak.

---

## 3. Motion "verbs" (multi-pose sequences)

These are the named combinations the pipeline step 7 ("Animate") picks:

| Verb | Pose sequence (frame @30fps in parens) | Easing between |
|---|---|---|
| enter-left | off-screen (0) → neutral (6) → watch (4 hold) | `power2Out` in |
| cross-stage-walk | `walkPose(phase)` loop × N steps | linear phase, ease-in/out on the ends |
| spot & gasp | watch → surprise (10) → neutral (6) | `power3Out` into surprise |
| grab-throw | reach (IK) → hold 4f → throw wind-up (8) → release (6) → follow-through (6) | `power2InOut`, `backOut` on release |
| trip-recover | trip (12) → impact 2f → sprawl hold 10f → get-up (18) | ease-in fall, `power2Out` recovery |
| celebrate | surprise → happy (arms up) 12f → dance_a/b ×4 beats | `backOut` on arms-up |
| wave-hello | neutral → wave (8) → oscillate 4×8f → neutral (6) | `power2Out` in/out, sine oscillation |
| exit-right | neutral → walk 2 steps → off-screen | `power2In` out |

**Pacing rule from what-if-animation's `references/look.md`**: nothing
static over ~1s — every hold gets *something* moving around it (dust,
sway, camera push-in). A 10-frame hold on a full stop is the genre's
"realisation" beat and is the only sanctioned still.

## 4. Spacing (the frame-by-frame distances)

"Spacing" = the distance a joint moves *between frames*. Even spacing =
constant speed = mechanical. Two rules:

1. **Slow-in/slow-out spacing**: for a 12-frame move, the per-frame
   distances roughly follow 1,2,4,6,6,6,4,2,1 (normalized) — that IS
   `power2InOut`, and it's what the easing does for you. When you see
   "spacing" in old 2D textbooks, it's the manual version of picking the
   right easing.
2. **Slow-in on impacts only**: fast-fast-fast-slow (1,3,5,2,0) for a
   strike landing. That's `power2In` into a hold.

## 5. Onions (how to verify a cycle by eye)

Render the loop at phase = 0, 0.125, …, 0.875 (8 frames), overlay them
at 20% opacity, and check:
- feet trace an *arc*, not a straight line (walk) or a lifted parabola (run);
- the head stays roughly vertical (it should — only `headTilt` moves it);
- no beat has both feet in the same place (that's the "standing still"
  dead frame a loop accidentally produces when phase snaps to 0 mid-scene).

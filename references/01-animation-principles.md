# Animation Principles

The twelve Disney principles, adapted for 2D code-drawn character animation.
Each one lists the *why*, the *number* to use, and the *code shape* that
produces it. These are the rules a reviewer (human or agent) checks in
`references/11-qa-checklist.md`; if a shot fails a principle, the checklist
tells you how to find it.

Source: the LottieFiles motion-design-skill `director/disney-principles.md`
(MIT) is the starting point; numbers cross-checked against the classic
"Animation: The Illusion of Life" and applied in our library. See
`references/00-source-index.md` for the full source list.

---

## 1. Squash & Stretch

**Why:** Communicates weight, speed, and impact. A jump should squash the
character *into* the ground and stretch it *out of* the ground.

**Number:** Squash to ~1.2× width / 0.8× height (volume-preserving —
multiply width by the inverse of height so the shape doesn't look like it's
gaining mass). Impact lasts 30-65ms (2-4 frames at 30fps), recovery
4-8 frames.

**In our library:** apply to the whole character's `scale` track, centered on
the *contact point* (the foot on the ground), not the figure's center:
`tl.scale('hero', 0, [1, 1], 6, [1.2, 0.8], Easing.power2InOut)` where
`scale` is [sx, sy] around a pivot at the feet. For a landing, hold the
squash 2 frames then spring back to [1, 1] over 4-8 frames.

**Stickman caveat:** a stick figure has no volume to preserve, so squash it
at the *legs* (knees tuck, hips drop) rather than scaling the torso —
otherwise it just looks like a stretch artifact.

## 2. Anticipation

**Why:** The viewer needs to know a big move is coming. A wind-up before
the swing makes the swing readable.

**Number:** A small opposite motion for 100-200ms (6-12 frames at 30fps),
about 10-20% of the main action's amplitude.

**In code:** add one keyframe *before* the launch key:
```
tl.add('hero.pose', 12, 'neutral',            // hold
      Easing.linear);
tl.add('hero.pose', 18, 'windup',            // anticipation: crouch/lean back
      Easing.power2Out);
tl.add('hero.pose', 24, 'leap',              // the actual launch
      Easing.backOut);
```

**Skip it** for micro-motions under 150ms total; it adds more time than
the action itself.

## 3. Staging

**Why:** Direct the eye. One hero, one clear action per beat. Everything
else is supporting cast — dim it.

**Number:** Dim non-hero elements to 40-60% opacity; optionally blur 2-4px.
Hero enters 100-200ms *after* the supporting elements settle.

**In code:** an `opacity` track on background/secondary elements, plus
starting the hero's motion 6-12 frames later than the settle. Use
`Easing.sineInOut` for the dim-down; it should feel like a breath, not a
blink.

## 4. Straight Ahead vs. Pose-to-Pose

**Why:** Two ways to plan a motion. *Straight ahead* = draw frame-by-frame
and see where it goes — good for fluid, organic, looping things (walk
cycles, water, hair). *Pose-to-pose* = plan the keyframes first, fill in
later — good for planned UI transitions and acting beats.

**In code:** For procedural loops (walk, run, idle), use
`walkPose(phase)` / `walkPose(phase, gait)` in `rig.js` — that's straight-
ahead thinking expressed as a phase variable. For one-off acting beats
(surprise, throw, trip), use pose-to-pose: keyframe the named poses from
`references/04` with easing between them, in `timeline.js`. **Never mix the
two on the same limb at the same time** — that's how you get a leg that
swings procedurally while the body is acting, and it looks broken.

## 5. Follow-Through & Overlapping Action

**Why:** Real objects don't all stop at once. Hair, a sleeve, a trailing
scarf, the head after a body turn — they lag and overshoot.

**Number:** Child elements lag the parent by 50-150ms (3-9 frames).

**In code:** on the same timeline, add the child's key 6-4 frames *after*
the parent's, with a slightly longer duration and `Easing.power2Out` or a
`spring()`. Example: after the character stops running, the head continues
forward 4 frames and settles:
```
tl.add('hero.pose', 30, 'stop', Easing.power2Out);      // body stops
tl.add('hero.headTilt', 34, 8, Easing.power2Out);       // head lags, 4 frames later
```

**Secondary motion via Verlet** (optional, for free-swinging limbs like a
tail or hair): a 4-point verlet chain gives most of the "alive" feeling
for almost no code. See `effects.js` for the pattern if you add hair.

## 6. Slow In & Slow Out

**Why:** Nothing in the real world starts or stops instantly. Linear
easing on spatial movement reads as "elevator door", not alive.

**Number:** Entrances ease *out* (fast start, slow landing). Exits ease
*in* (slow start, fast finish). On-screen motion that continues uses
ease-in-out. **Never linear for spatial movement** — this is a QA-critical
rule; a `Easing.linear` on a character's position is a checklist failure.

**In code:** `Easing.power2InOut` for most on-screen moves,
`Easing.power2Out` for entrances, `Easing.power2In` for exits. The
`tl.smooth()`, `tl.pop()`, and `tl.bez()` helpers wrap these.

## 7. Arcs

**Why:** Limbs swing on arcs (shoulder is the pivot), and a straight-line
move feels mechanical. Adding a perpendicular offset at the path's midpoint
restores the arc.

**Number:** 10-20px perpendicular offset at the midpoint of the path
(5px for corporate/calm, 20px+ for playful).

**In code:** instead of one `tl.add('hero.x', ...)` key, split into two
via a mid keyframe with the perpendicular offset, or let the `walkPose`
phase produce the arc naturally (it does — the knees follow an arc, not a
line). For a thrown object, add a mid key 10-20px above the straight line
between start and end.

## 8. Secondary Action

**Why:** A supporting motion that runs *under* the main one, at 30-50%
amplitude, adds richness without stealing focus.

**Number:** 30-50% of the primary's amplitude, started 50-100ms *after*
the primary begins, with a *different* easing (so the two don't sync up).

**In code:** two tracks on the timeline. E.g. character lands (primary)
while dust puffs out at the feet (secondary, 50% amplitude, 4 frames late,
`Easing.sineOut`):
```
tl.add('hero.y', 24, 0, Easing.power2Out);        // land
tl.add('dust.t', 28, 1, Easing.sineOut);          // secondary, 4 frames later
```

## 9. Timing

**Why:** The single biggest lever for weight and mood. Same motion, half
the frames = twice the weight.

**Number:** Heavy 400-800ms; light 100-250ms. Sad 600ms+; happy 200-400ms;
urgent 100-200ms. Entrances 30-50% longer than exits.

**In code:** the *duration* (in frames) of a track is the timing. For the
same pose-change, a 12-frame version reads as deliberate/weighty; a 4-frame
version reads as snappy/surprised. Pick the duration from the *emotion*
you want, not from the distance the limb travels.

## 10. Exaggeration

**Why:** Push the pose past its realistic limit and it reads as more
characterful.

**Number:** Playful 15-25% overshoot; Energetic 20-30%; Corporate 0-5%;
Premium 0%. Rotation exaggeration ±5-15° on a head or body twist.

**In code:** the overshoot *is* the `Easing.backOut` / `Easing.elasticOut`
curve — you don't manually keyframe the overshoot, you pick an easing that
has it. `tl.pop()` uses `backOut` which overshoots by ~10% at default
`s=1.70158`; pass a custom `cubicBezier(0.68,-0.55,0.265,1.55)`
(`Easing.elasticSnap` in `library/js/easing.js`'s `bez` table) for
bigger overshoot.

## 11. Solid Drawing

**Why:** Consistent proportions across keyframes. If the head is 1/7 the
body height in pose A and 1/6 in pose B, the figure looks like it's
*melting* between them.

**In code:** our rig *guarantees* this — `solve(pose)` computes every
joint from one set of segment lengths in `DEFAULTS`. The QA checklist
("character identical across shots") is checking that you're using the
same rig instance, not redrawing the figure per shot. **Never hand-write a
second stick figure in the same video.**

## 12. Appeal

**Why:** The motion should be pleasant to watch. "Appeal killers": jerky
motion, inconsistent timing between similar moves, abrupt stops, uniform
animation where some variation would help.

**In code:** this is the umbrella principle the QA checklist enforces.
Concrete signals: (a) no `Easing.linear` on spatial moves (violation of
#6); (b) two similar actions in one scene use the same easing/duration
("consistent timing"); (c) nothing stops dead — every stop has a
settle of 50-100ms; (d) on the 100th viewing, you can still tell which
element is the hero.

---

## Combining them: the common recipes

The `director/disney-principles.md` in LottieFiles gives five named
combinations. We use them as *starting templates* for the most common
actions:

| Action | Principles combined |
|---|---|
| Button-style press (a character taps something) | Anticipation + Squash/Stretch + Follow-Through + Secondary + Timing |
| Card / character entrance | Anticipation + Arcs + Slow In/Out + Follow-Through + Staging |
| Success moment (character celebrates) | Exaggeration + Secondary + Timing + Squash/Stretch + Appeal |
| Error shake | Timing + Slow In/Out + Staging (**no** exaggeration) |
| Loading / waiting | Timing + Slow In/Out + Appeal (ambient breathing) |

Read `references/02-timing-easing-tables.md` for the exact ms/frames
numbers for each of these, and `references/04-pose-and-motion-library.md`
for which named pose pairs you keyframe for each.

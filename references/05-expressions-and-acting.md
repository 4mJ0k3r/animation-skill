# Expressions & Acting

A stick figure's "face" is 4 drawable things: **eyes, brows, mouth, and
head tilt**. That's the entire vocabulary of acting for a stickman —
the head tilt alone carries half the meaning ("tilt back = defiant /
startled; tilt down = sad / embarrassed / thinking").

Everything here is *deterministic data* (angles, radii, which feature is
on) so an agent can keyframe it in `timeline.js` just like a pose.

> Conventions cross-checked against stix's `library/expressions.md`
> (9 expressions, SVG geometry, MIT) and what-if-animation's `faceAt`
> pattern: **"Faces swap, they don't morph"** — `poseAt` holds the
> earlier face until its key lands; the face *instantly* changes,
> often masked by a blink.

---

## 1. The 9 face states

Angles in degrees; eye/brow positions are relative to head center
(local head coords: x right, y up, radius = `headR`).

| Face | Eyes | Brows | Mouth | Head tilt bias | Reads as |
|---|---|---|---|---|---|
| `neutral` | two dots r=0.12R at ±0.35R, y≈+0.05R | (none drawn) | flat line, width 0.4R, y=−0.3R | 0 | default |
| `happy` | dots → small arcs (∪ shape) | (none) | up-arc, width 0.5R, radius 0.25R | +2° | joy, relief |
| `sad` | dots, y −0.05R lower | inner ends up (/\) | down-arc, radius 0.2R, y=−0.35R | −8° | dismay, loss |
| `surprised` | circles r=0.2R (open) | raised, flat | O-circle r=0.15–0.25R | −10° | shock, gasp |
| `angry` | dots, y +0.1R | steep /\ (inner ends down 0.15R) | tight flat, 0.3R | +4° | determined, rage |
| `cool` | half-lidded (dot + top line) | flat, high | slight smirk, 0.3R asymmetric | +6° | smug, unbothered |
| `worried` | dots raised y +0.1R | /\ gentle | wavy short line (2 bumps) | −6° | anxious, uncertain |
| `oops` | dots → small x's or wide circles | /\ high | open wide O r=0.25R | −12° | "oh no", fall moment |
| `dizzy` | x eyes | (none) | wavy mouth, head tilts ±6° at 1Hz | oscillating | knocked out, post-impact |

Draw rules (for `drawFigure` / your own SVG head):
- Eyes are the *highest-contrast* mark on the face — 0.12–0.15R radius,
  filled, same color as the body line. No thinner.
- Brow lines: 0.08R thick, length 0.5R, at y +0.25R. They are the
  cheapest way to change meaning — a flat line over neutral eyes =
  concerned; steep /\ = anger.
- Mouth: 0.06–0.08R thick, at y −0.3R (below head center). An *arc* is
  more readable than a straight line for any non-neutral emotion —
  a straight-line "frown" reads as blank, not sad.
- **Only 2–3 features change at a time.** Fully custom faces with
  distinct eyes, brows, AND mouth for every emotion don't read at
  stick-figure scale. Pick the single most legible feature per emotion
  (usually the mouth).

## 2. Blinking (the free "alive" signal)

Every 3–6 seconds (90–180 frames at 30fps), close the eyes for 2
frames. Implementation: `eyeOpen = !(frame % blinkPeriod) < 2` → draw a
line instead of a dot. Blink while the character is *doing* something
(never on the peak of a gasp, never on the impact frame — blinking on
impact is a QA red flag for "agent didn't check the frame").

Stagger blinks between characters so they don't blink in sync
(period 150 frames for hero, 190 for side character — different primes
keep them out of sync for the whole scene).

## 3. Eye direction (looking)

Stick figures usually have forward-facing dots. To *look somewhere
else*, three options, cheapest first:

1. **Shift the dots** ±0.1R horizontally (looking sideways).
2. **Tilt the head** toward the target (the figure's "gaze" = head
   direction). This is what almost all stick-figure animation does —
   the head *is* the eyes.
3. **Draw eyes as ellipses with a pupil offset** for a true gaze —
   only worth it for close-ups (zoom 3–4.5, see `references/06`).

Rule: **head tilt and eye shift point the same way.** A head tilted
right with eyes shifted left is a character "talking to someone off
screen behind them" — a specific, rare beat. Don't do it by accident.

## 4. Emotion → motion mapping

An emotion is not just a face — it's a face + a *body* + a *timing*
change. This table is the "emotion map" (condensed from LottieFiles'
`director/emotion-mapping.md`, stickman-adapted):

| Emotion | Face | Body posture | Motion character |
|---|---|---|---|
| Joy | happy | open, arms loose, up | fast `backOut` pops, arcs |
| Calm | neutral/cool | slow, low amplitude | `sineInOut`, 2000ms+ moves |
| Urgency | determined/angry | forward lean 15-20° | 100-200ms, `power3Out`, no anticipation |
| Sadness | sad | hunched, head down 8-12°, drops 6-10px | 600-1200ms, `power2InOut`, slow settle |
| Surprise | surprised | freeze 6-10 frames first, then whip | whiplash `power3Out` into the reaction, hold on the peak |
| Fear | worried/oops | weight back, knees bent, small | quick 100-150ms flinches, tremor 4-8px |
| Exhausted | sad+droop | arms hang [0,0], head +15° down, 2Hz 3px bob | very slow, everything else moves around them |

**The freeze is the surprise beat.** For "a stickman gets surprised
and jumps": neutral → 6-10 frame freeze (face swaps to surprised
mid-freeze, that's the mask) → whiplash up → peak → land. The freeze
is 200-330ms at 30fps — that's what makes it *read* as surprise
rather than as a quick jump.

## 5. Acting beats (how to direct one)

The what-if skill's look rule: **"the expression and pose say the line
without the voice."** Concretely, one acting beat = 3 decisions:

1. **The read:** what does the character *know* in this beat? (spot
   the mouse / see the cliff / hear the voice). The face matches
   knowledge, not the event — they see the rock *after* their eyes
   reach it.
2. **The physical answer:** which of the motion-verbs in
   `references/04` §3? The verb IS the acting. "Trip" is
   stumble→fall→sprawl; "recover" is the get-up sequence.
3. **The hold:** every beat ends on a 4-10 frame hold where the face
   is *settled* on the emotion. No hold = the beat is skipped.

Between beats, transition with `blendPose(A, B, t)` over 6-12 frames
at `power2InOut`, and swap the face at `t ≥ 0.5` (`blendPose` does
this — face changes at the midpoint). Never cross-fade two faces
over 20+ frames: a 3-second face morph looks like a glitch, not a
feeling.

## 6. Talking (mouth sync, optional)

If you add captions/voice: mouth open/close at 6-8Hz for neutral
speech, peaks (0.25R open) on stressed syllables. For a stickman,
*word-level* sync is enough — 3 mouth shapes (closed / small O / wide
O) cycled to the beat. See `references/09-sound-and-sync.md` for the
voice-to-word timestamp pipeline.

## 7. Two-character acting

- One lead, one reaction. The lead does the action; the reaction
  character's beat is 4-8 frames *later* (they *see* it) and uses a
  20-40% smaller amplitude (staging, `references/01` §3).
- Opposite faces: lead `determined` + reaction `worried` reads
  instantly. Same face on both = the audience can't tell who's who.
- They don't cross the midline while doing the same action
  (two simultaneous surprise-whips look like a glitch).

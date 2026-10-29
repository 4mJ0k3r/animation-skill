# Storytelling & Shots

How to turn a one-line idea into a beat sheet, then a shot list, then
the `story.json` scenes[] entries. This file covers the *content*
decisions; `references/06` covers how each shot is framed.

> The 7-beat structure below is adapted from what-if-animation's
> `references/formula.md` (MIT), which decodes the "What If" YouTube
> genre measured frame-by-frame. We generalize it to any 10-60s clip.

---

## 1. The 7-beat clip structure

Any clip, 10-60 seconds, is built on these 7 beats (in order; beats 5-7
can be compressed in a short clip):

1. **Cold open, mid-action** — start 3-5s *into* something already in
   motion. A character mid-walk, mid-thought, mid-fail. No titles yet.
   The viewer's first question ("what is happening?") is the hook.
2. **Premise + one rule** — the title card / setup line. One sentence,
   one number, one rule the rest of the clip depends on ("gravity just
   stopped for 5 seconds").
3. **The fun escalation** — 2-4 quick demonstrations of the premise
   working, each bigger than the last. Fast cuts, 0.7-1.5s each.
4. **The turn (not-so-fun)** — the cost appears, with *a real checked
   number* ("that's 40kg of force — more than a car door at 30 km/h").
   The number is what makes it a story and not a fantasy.
5. **The observer** — someone else sees it. A second character, a
   phone camera, a "man in a suit". The external witness is what turns
   personal events into a scene.
6. **The moral choice** — what do you do with it, at cost to someone
   close? (Usually a small character: a kid, a pet, a friend.)
7. **Cliffhanger / payoff + tag** — the last line sets up the next
   question ("Part 1 of 2") or lands the moral cleanly. End on a
   *held* pose, 8-12 frames, not mid-motion.

**15-25s skill version**: beats 1-4 in full, 5-7 folded into the last
line. 45-65 words of on-screen text total at that length (~2.5-3
words/sec).

## 2. Beat sheet → shot list

One shot per *picture* (not per word). The test: read the beat sheet,
and for every clause ask "what do we *see*?". That's the shot.

Pacing rules (measured on what-if's 24fps proof clips, keep for ours):
- **Cut rate**: 20-27 cuts/minute in an opener. For a 20s clip: 6-9
  shots.
- **Shot length**: 0.7-3s. Nothing static over ~3s (something must move
  — dust, a sway, a camera push).
- **Cut on the word**: each cut lands *on or just before* the word it
  illustrates. If the shot list and the script don't line up on timing,
  re-time the cuts, not the script.

## 3. Scene count, duration, fps (the infer step)

When the user gives one line ("a stickman gets surprised and jumps"),
infer the parameters (stix's step-1 table, extended):

| Parameter | Range | Default | How to infer |
|---|---|---|---|
| scenes | 1-6 | 2 (or 1 if single beat) | count distinct locations/emotional beats in the prompt |
| duration per scene | 4-12s | 8s | the stix system is built around a fixed 8s scene; keep it |
| total duration | 10-60s | ~ scenes×8 | user says "short" → 1 scene; "episode" → 4-6 |
| fps | 8-30 | 30 for motion, 12-15 for GIFs | fast action or export quality; GIFs halve it |
| aspect | 16:9 / 9:16 / 1:1 | 16:9 | "for tiktok" → 9:16 |
| mood | playful/urgent/calm/dramatic | playful | the emotion in the prompt |

Write them to `story.json` (step 3 of the pipeline) and *don't ask the
user* unless the prompt is genuinely ambiguous between 1 scene and 6.

## 4. The position contract (per scene, in story.json)

For every scene and every character, `story.json` must state:
- `start`/`end`: [x,y] in the scene's viewBox (feet position).
- `face`: 1 or -1 (facing direction; must be consistent across scenes
  for the same character unless they turn around).
- `start_pose`/`end_pose`: named poses from `references/04`.
- `z`: integer layer (lower = further back).
- `props`: which prop IDs are in-frame and where (each prop gets its
  own `[x,y]`).

This is the "position contract" stix enforces in its story.json: exact
coordinates, so the scene composer *positions assets* without re-
deciding where things go. It's what makes scene N+1 start where scene N
ended (continuity check, `references/11` item 12).

## 5. Transitions between scenes

Pick one per cut, never stack two:

| Transition | Duration | Use |
|---|---|---|
| Hard cut (scene N ends, N+1 begins same frame) | 0 | default. 80% of cuts. |
| Match cut | 0 | end-pose of N ≈ start-pose of N+1 (a jump that lands in the next scene). The strongest tool — use it at least once in every multi-scene clip. |
| Fade through white | 8-12 frames | time passage, "later that day" |
| Fade to black | 8-12 frames | act break, ending |
| Whip pan (fast horizontal blur) | 4-6 frames | energetic location change |
| Cut to black + title card | 20 frames | the beat-2 premise reveal |

stix's `transitions.md` (11 patterns) has CSS `@keyframes` for each of
these; our `templates/multi-scene.html` implements the same set.

## 6. What NOT to do (genre rules, from what-if's traps)

- **No captions of the voice.** Text on screen = the title card +
  small readouts (a counter, a label). If you're subtitling narration,
  the clip is too long — cut the scene instead.
- **No "HA HA" text, no speech bubbles.** Stick-figure humor is in the
  acting; a "HA HA" bubble is the visual equivalent of telling a joke.
- **No empty frame cuts.** Whatever the next shot shows, *something*
  must already be on screen at frame 0 of that shot. (Start a pop at
  t+3, never t-1 — a cut to a blank frame is a hard visual glitch.)
- **Numbers are sourced.** Any number in the script (the "real fact"
  of beat 4) gets a `science` entry: claim, working, source. The
  formula's credibility *is* the checked number.

## 7. The shot-list data shape (what step 3 writes)

```json
{
  "scene": 2,
  "duration_s": 8,
  "background": "park",
  "camera": { "move": "static", "zoom": [1.0, 1.15, "power2InOut", "frames": [0, 48, 96]] },
  "characters": [
    { "id": "cat", "start": [30, 310], "end": [600, 310], "face": 1,
      "start_pose": "runA", "end_pose": "neutral",
      "actions": [
        { "pose": "runA", "frames": [0, 20], "ease": "power2Out" },
        { "pose": "neutral", "frames": [20, 40], "ease": "power2InOut" },
        { "note": "cat stops, spots mouse" }
      ]
    }
  ],
  "props_used": ["bench", "tree"],
  "transition_in": "hard",
  "sfx": [{ "at_frame": 30, "kind": "thump" }]
}
```

`actions` is a list of (pose, [from_frame, to_frame], ease). The
renderer interpolates the full joint record between consecutive actions
via `blendPose` + the easing. `face` swaps on the midpoint.

## 8. Self-edit pass (before step 6)

Read the shot list like a director, not a renderer:
1. Every shot has a *reason* to exist (if a shot could be cut without
   the story changing, cut it).
2. No two adjacent shots same size+angle (`references/06` §7).
3. The one "real number" beat (if any) gets its own shot, held 8-12
   frames on a close-up or schematic.
4. The ending is a *held pose* 8-12 frames, not motion.
5. Total duration ≤ the inferred duration. If it's over, cut beats,
   don't speed up.

---
name: stickman-animation
description: >
  Make a code-drawn 2D stickman/stick-figure animation (explainer,
  gag, or "what if" clip) from a one-line idea, as a seekable HTML
  file plus MP4/GIF exports. Use when asked to "make a stickman
  animation", "animate this", "explainer animation", "what if
  animation", "code a cartoon clip", "GIF of a stick figure".
license: MIT
---

# Stickman Animation Skill

Generate deterministic, code-drawn 2D stick-figure animations from a one-line prompt. Renders directly via HTML5 Canvas + ES modules with zero bundle step, captures deterministic PNG frames via headless Chromium, and stitches to MP4/GIF using ffmpeg.

## Prerequisites
Before running, verify environment tools:
```bash
node scripts/preflight.mjs
# or: bash scripts/preflight.sh
```
Required tools: Node.js 18+, ffmpeg 8+, python3 + Pillow, Playwright Chromium (`npx playwright install chromium`).

---

## The 10-Step Pipeline

Every animation proceeds through these 10 gates in order:

### 1. Interpret & Infer Parameters
Infer missing parameters without asking unless the prompt is fundamentally ambiguous:
- **Duration:** 2–8s for gags/loops; 15–25s for explainers.
- **FPS:** 30 fps for video; 12 fps for GIF-first previews.
- **Aspect Ratio:** 1:1 (960×960) default working canvas; 16:9 (1920×1080) for explainer; 9:16 (1080×1920) for vertical reels.
- **Output:** Write project header into `story.json`.

### 2. Beat Sheet / Script
Draft the beat sequence using the 7-beat structure (`references/07` §1):
1. *Hook* (0–3s): Visual question / premise.
2. *Setup* (3–6s): Normal world / baseline physics.
3. *Escalation* (6–10s): Speed / scale multiplies.
4. *The Turn / Science* (10–15s): The counter-intuitive physical truth (must source facts).
5. *Absurdity* (15–18s): Logical escalation of the truth.
6. *Climax* (18–22s): Visual peak.
7. *Punchline* (22–25s): Button / final gag.

### 3. Decompose into Scenes & Validate `story.json`
Fill `story.json` per scene with position contracts (`references/07` §4):
- For each character: `id`, `start: [x,y]`, `end: [x,y]`, `face: 1|-1`, `start_pose`, `end_pose`.
- For each prop: `id`, `at: [x,y]`.
- Enforce the schema and validate (all scripts accept relative or absolute paths):
```bash
node scripts/validate_story.mjs path/to/story.json
```

### 4. Assemble Assets (One Rig, Never Redraw)
**Hard Rule:** Never draw characters by hand. `library/js/rig.js` is the single source of truth:
- Copy `library/js/rig.js`, `timeline.js`, `easing.js`, `effects.js`, `camera.js` next to your scene HTML.
- Secondary characters: scale height to ≈0.7× (e.g. 224px vs 320px) with distinct color (`references/03` §9).

### 5. Render Storyboard Keyframes
Render keyframe stills (frame 0 and cut boundaries) using `scripts/capture_frames.mjs`:
```bash
node scripts/capture_frames.mjs --scene scene.html --fps 30 --duration 8 --out frames/
```

### 6. Self-Check Storyboard (Ship Gate)
Check keyframes against `references/11` gates:
- Silhouette test: poses readable at 40% scale.
- Eye trace: subject lands on rule-of-thirds intersections (`references/06`).
- Consistency: stroke width (default 7px on 960px canvas) and ink `#1c1c1c` constant across shots.

### 7. Animate: Fill Scene Template
Copy `templates/single-scene.html` (single shot) or `templates/multi-scene.html` (multi-scene):
- Character motion: use `walkPose(phase, gait)` for locomotion (`gait=0` walk, `gait=1` run).
- Poses: use named keys from `POSES` in `rig.js` or angle records from `references/04`.
- Easing: **never use linear for spatial movement**. Use `power2Out` for decelerations, `power2InOut` for transitions, `backOut` for gags.
- Determinism contract: ensure `window.__seek(frame)` draws purely from frame number with no wall-clock leaks.

### 8. Capture Frames & Stitch
Run capture and stitch pipeline:
```bash
node scripts/capture_frames.mjs --scene scene.html --fps 30 --duration 8 --out out/frames
bash scripts/stitch.sh out/frames out 30 both
# or cross-platform: node scripts/stitch.mjs out/frames out 30 both
```

### 9. Final QA on Contact Sheet
Generate an 8×8 contact sheet and verify all frames:
```bash
python scripts/contact_sheet.py out/frames 8x8 out/contact.jpg
```
Verify:
- No foot skate / moonwalking: check stance foot stays planted (`references/03` §7).
- No NaN joints or joint hyperextensions past 60°.
- Determinism diff: frame 0 captured twice is byte-identical.

### 10. Report & Deliver
Provide the user with:
- Paths to final `.mp4` and `.gif`.
- File sizes and frame counts.
- Sourced claims table (if explainer).
- Any UNVERIFIED flags.

---

## Hard Rules

1. **Determinism Contract:** Frame `N` must render byte-identically on every capture. No `Math.random()`, no `Date.now()`, no unseeded noise. Use `fx.hash(seed, i)` for procedural scatter.
2. **One Rig for All Figures:** Every human character is rendered by `solve()` / `drawFigure()` in `rig.js`. No custom stick-figure geometry.
3. **No Spatial Linear Easing:** Easing on position must use `power2Out`, `power2InOut`, or `cubicBezier`. Linear is only allowed on cyclic gait phases.
4. **Faces Swap, Never Morph:** Facial expressions change discretely on keyframes (`references/05`).
5. **Checked Numbers Only:** In explainer clips, every on-screen number must have a corresponding calculation and citation entry in `story.json` `science[]`.
6. **Paid Audio Optional:** TTS audio is strictly optional. Default to silent animation with visual readouts unless explicitly requested.

---

## Quick Reference Index

| Need | Read File |
|---|---|
| Timing, easing curves, duration presets | `references/02-timing-easing-tables.md` |
| Joint angles, segment lengths, gait formula | `references/03-character-rig.md` |
| Pose library (walk, run, jump, crouch, fall) | `references/04-pose-and-motion-library.md` |
| Facial expressions, eyes, blinks | `references/05-expressions-and-acting.md` |
| Framing, rule of thirds, safe margins | `references/06-scene-composition.md` |
| Shot types, match cuts, 7-beat script | `references/07-storytelling-and-shots.md` |
| Speed lines, dust, impact stars, text pop | `references/08-props-and-effects.md` |
| Audio loudness, SFX sync | `references/09-sound-and-sync.md` |
| FFmpeg flags, headless capture | `references/10-rendering-and-export.md` |
| QA checklists and pass/fail criteria | `references/11-qa-checklist.md` |
| Common traps, bugs, and fixes | `references/12-traps-and-troubleshooting.md` |

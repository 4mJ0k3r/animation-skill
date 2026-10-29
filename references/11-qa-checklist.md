# QA Checklist — Ship Gates

Run these in order before step 10 (report). Each item is binary: pass or
fail. "HOW" is the check; "FAILS" is the specific defect that a miss means.
The "SEE" column points at the file that explains the fix — read it, then
re-run the check.

The single most useful artifact is the **contact sheet** (8×8 grid of
every Nth frame of the clip, `python scripts/contact_sheet.py out/frames
8x8 out/contact.jpg`, see `references/10` §6). Most checks below are "look
at the contact sheet and find X".

---

## (a) Character consistency

| # | CHECK | HOW | FAILS | SEE |
|---|---|---|---|---|
| 1 | **Character identical across shots.** Grep every scene file; the figure is drawn by the same rig function (one import of `library/js/rig.js`, one `drawFigure`/`solve` call graph). No hand-written second stick figure anywhere in the repo. | `grep -rn "drawFigure\|solve(" out/` → one rig source; `grep -rn "beginPath\|moveTo" out/*.html` for stray manual line-drawing of a figure outside `rig.js` | Head:body ratio drifts between shots; limbs are different lengths in scene 2 vs scene 1; the character "melts" at cut points | `references/03` §1, §11 ("one rig, many looks"), `references/01` §11 |
| 2 | **Same line weight across all shots.** | `grep -n "lineWidth\|strokeWidth" out/` — every stroke value is the same constant (default 4px) | A 4px line in scene 1 and a 2px line in scene 2 reads as two different characters / a sketch over a confident figure | `references/03` §1, `references/06` §5 (style consistency) |
| 3 | **Same colors.** Character ink `#1c1c1c` (or chosen color) never changes between shots; head/torso fill consistent. | grep `strokeStyle\|fillStyle` per scene file; spot-check contact sheet | A "mascot" colored head in shot 1 becomes plain dark in shot 3 — the viewer loses track of who's who | `references/03` §1, §9–10 |
| 4 | **Facing is consistent** unless the character explicitly turns (facing must flip on a turn, not drift). | Compare `face`/`facing` in `story.json` across scenes; watch the contact sheet for a sudden mirror | Character faces right in scene 1, left in scene 2 with no turn — reads as a different person / a glitch | `references/03` §2, `references/07` §4 (position contract `face`) |
| 5 | **Second character is scaled ~0.7× with a distinct color.** | grep both rig calls: `height: ≈0.7×` of hero, `color:` differs | Two same-size, same-color figures — the audience can't tell them apart in silhouette | `references/03` §9 |

## (b) Motion believability

| # | CHECK | HOW | FAILS | SEE |
|---|---|---|---|---|
| 6 | **Limbs connected — no floating hands/feet.** On a reach/grab, the hand's IK target snaps to the prop: `ik2(...)` with the prop handle as target, and no keyframe where the hand is 5+ px off the object mid-hold. | Grep every `reach`/`grab` for an `ik2` call (not just FK angles); on the contact sheet, zoom the grab frame — hand touches the object, no gap | Floating hand (a grab that visually misses), or an arm detaching from the shoulder during a blend | `references/03` §4–5, `references/04` §2 reach/grab |
| 7 | **No joint hyperextension.** At no frame does a knee bend past ~90° (the leg reads as "bent the wrong way"); the back leg of a walk never exceeds ~60° past vertical. | Contact sheet: find the "down" and "up" walk beats — knee angles ≤ 90°; `references/04` §1 rule 4 | A locked/hyperextended knee reads as a broken rig / robotic figure | `references/04` §1, §2 walk cycle |
| 8 | **Feet planted during the stance phase — no skating / moonwalk.** For a run-in-place, `scroll = stride × cyc / duty` (walk ≈ 106 u/s, run ≈ 383 u/s, NOT `stride × cyc`). For a cross-scene walk, the character's on-screen speed is constant and matched to the gait. | Grep `motionGrid` / scroll speed in the scene against the `references/03` §7 formula; contact sheet: the planted (stance) foot does not move in x between contact and up beats | The planted foot slides backward — the "moonwalk" / skating bug; the figure looks like it's gliding on ice | `references/03` §6–7, `references/04` §1 rule 2, `references/08` §2 motion grid |
| 9 | **Arms counter-swing with legs** (the same-side arm as the back leg swings forward). | Grep `walkPose` usage — confirm the default counter-swing, or manually check the walk table in `references/04` §1 | Both arms swing with both legs → waddling; or both arms static → glider | `references/04` §1 rule 1 |
| 10 | **Hip bob present (twice per gait cycle).** | Grep `bob` in the walk keyframes; contact sheet: the figure doesn't ride the rails, the hips rise/fall | A walking figure with no vertical bob reads as "on rails" / gliding | `references/04` §1 rule 3, `references/03` §6 |
| 11 | **Anticipation before every big move.** A crouch/lean-back/wind-up keyframe (100–200 ms, 10–20 % of the launch amplitude) exists *before* the launch keyframe for jumps, throws, and surprises. | Grep `windup\|crouch\|anticip` for a keyframe with an earlier `t` than the launch; contact sheet shows a "coiled" frame before the pop | A throw/jump with no wind-up reads as mechanical — the object appears to teleport; no weight | `references/01` §2, `references/04` §2 jump/throw |
| 12 | **Falls ease-IN (`power2In`), never ease-out.** The trip/fall torso-rotation over 10–12 frames uses `power2In` (gravity accelerates). | Grep the fall keyframe for `power2In` (or an equivalent accelerating bezier); check the impact frame for `dust()` + `flash()` | A fall that eases-out looks like the character was *punched* into the ground, not gravity-caught | `references/04` §2 trip/fall, `references/08` §3 collision |
| 13 | **A stop has a settle** (50–100 ms / 2–3 frames), nothing stops dead mid-motion. | Contact sheet: after every hard stop (foot plants, door closes), 2–3 frames of a spring/squash settle | An abrupt zero-velocity stop reads as a render stall, not a landed weight | `references/01` §12, `references/02` §8 spring |
| 14 | **Arcs on limbs** — a swinging hand/throw traces an arc, not a straight line (10–20 px perpendicular offset at the apex). | Grep for a mid keyframe on any thrown object; contact sheet: the prop's path curves | A straight-line thrown object reads as a glitch, not a throw | `references/01` §7, `references/08` §1 rules |
| 15 | **Squash-on-impact** for landings: knees tuck + hips drop, hold 2 frames, spring back 4–8 frames (stickman squash at the *legs*, not a whole-figure scale). | Grep the landing beat for a 2-frame squashed pose then a `power2Out` recovery | A landing with no squash reads as the character floating onto the ground; scaling the whole figure looks like a stretch bug | `references/01` §1, `references/03` §8 |

## (c) Composition & readability

| # | CHECK | HOW | FAILS | SEE |
|---|---|---|---|---|
| 16 | **Readable silhouettes at 40 % scale.** Shrink the contact sheet cells to ~40 % (or 480 px wide) — the hero's pose is still identifiable in every beat. | Render `contact_sheet.py` at 480 px wide (or eyeball it zoomed out); the figure's arm/leg angles differ enough between beats that you can tell "jump" from "wave" from "sit" without labels | At 40 % every pose looks like the same stick blob; the action is only readable in a close-up you didn't use | `references/04` §2, `references/01` §10 exaggeration |
| 17 | **Text legible and inside safe margins.** All on-screen text sits inside the title safe (80 %, x 384–1536 / y 216–864 at 1080p); nothing in the bottom 15 %; contrast against the background ≥ 4:1. | Grep `ctx.fillText` / text elements; on the contact sheet, confirm no word touches a frame edge | A word on the frame edge = "failed QA" — it gets cropped by player UI / mobile overlays | `references/06` §2, §5 |
| 18 | **Z-order correct — no limb drawn over the torso it should be behind.** Draw order: far limbs → torso → near limbs → head; scenes: background → far props → characters → near props → foreground → FX. | Grep the draw sequence in each scene for the limb/torso order; contact sheet: no leg crosses the torso the wrong way in any frame | A leg over the chest reads as a deformed / broken figure — the #1 composition bug | `references/06` §8 |
| 19 | **A prop near a hand is NOT read as the hand.** There is clear space around every hand; insert-shot props are scaled up hard (macro 6–10×). | Contact sheet: a ball/prop next to a hand doesn't share a color/line that makes them fuse; in the "key prop" shot the object is large, not small | A small prop hovering by a hand reads as a claw / a missing finger | `references/08` intro + §1, `references/06` §7 macro insert |
| 20 | **Every standing object has a contact shadow** (dark ellipse, 0.15–0.25 alpha, 1–2 px tall at the ground line). | Grep for the shadow ellipse under each prop/character; contact sheet: nothing floats except props that are explicitly airborne | A flat 2D scene reads as "everything is floating" — no ground read | `references/06` §3 |
| 21 | **One hero, one clear action per beat; support dimmed to 40–60 % opacity** (staging). | Grep `opacity` on background/secondary elements; the hero enters 100–200 ms *after* the support settles | No focus — the eye can't tell what's happening; the hero competes with the background | `references/01` §3, `references/05` §7 |
| 22 | **No two adjacent shots share size AND angle.** | Compare consecutive shots in `story.json` (zoom + cam.y): the cut wide→medium, not wide→wide | A wide→wide cut reads as a skipped beat / a freeze | `references/06` §7, `references/07` §8 |
| 23 | **Consistent line weight & color across shots** (already covered in #2/#3 — re-verify on the *final* contact sheet, not the per-scene stills). | Re-run the greps from #2/#3 on the stitched output | Drift that only appears at scene boundaries | `references/03` §1, `references/06` §5 |

## (d) Timing & loop

| # | CHECK | HOW | FAILS | SEE |
|---|---|---|---|---|
| 24 | **Timings within the agreed duration.** Total captured frame count = `duration × fps`, with no overflow and no early stop. | Count frames: `ls out/frames/ | wc -l` must equal `fps × duration` from `story.json`; re-run the capture and confirm the determinism diff (frame 0 captured twice = byte-identical) | The clip ends mid-action, or the last shot is cut short; a capture that isn't reproducible means a wall-clock leak somewhere | `references/07` §3, `references/10` §1–2 |
| 25 | **One fps for the whole clip; a mid-clip fps switch is a visible speed jump.** | Grep `fps` in `story.json` and both capture commands — identical | Scene 2 plays at 1.5× the speed of scene 1 — a jump cut the viewer feels | `references/10` §4 |
| 26 | **No static shot over ~3 s.** Every hold beat has *something* moving around it (dust, sway, camera push-in, lamp flicker). A 10-frame full-stop hold is the only sanctioned still. | Scan the contact sheet for 90+ consecutive near-identical frames; if found, confirm the beat is the "realisation" hold or that ambient motion was added | A 1 s+ dead hold reads as "the animation froze / the agent stopped"; the clip looks broken | `references/04` §3 pacing rule, `references/08` §2 "life comes from around the character" |
| 27 | **Loop seam clean (if the clip loops).** Frame 0 and the final frame are the *same pose* (and same camera). For a walk-in-place loop, `walkPose(0)` and `walkPose(phase_end)` must be identical and the scroll must wrap exactly. | Grep the final `actions[]` entry: `end_pose` == `start_pose`; seek to frame 0 and frame N-1 in the browser, screenshot both, diff | A visible "snap" at the loop point; the walk cycle jumps a half-step at the seam | `references/04` §5 onions, `references/01` §4 straight-ahead loop, `references/03` ��6 |
| 28 | **Blinks are staggered between characters** (two characters never blink on the same frame). | Grep `blinkPeriod` per character — use different values (e.g. 150 vs 190 frames, ideally different primes) | Two characters blink in unison reads as a synced glitch; the audience notices immediately | `references/05` §2 |
| 29 | **Entrances ease-out, exits ease-in, on-screen moves ease-in-out — no `Easing.linear` on a character's spatial position.** Linear is only allowed for a scroll, a timer bar, or a thrown object's spin. | `grep -n "linear\|Easing.linear\|'none'" out/` — every hit is a scroll/timer/spin, never a character position | A character moving at constant speed reads as "elevator door" / mechanical; the biggest single motion believability failure | `references/01` §6, `references/02` §5 |
| 30 | **Face swaps at the blend midpoint, not a 20+ frame morph.** Faces change instantly (often masked by a blink); never cross-fade two faces over 1 s+. | Grep `blendPose` face-timing (face swaps at `t ≥ 0.5`); confirm no 20+ frame face interpolation | A slow face morph reads as a glitch, not an emotion change | `references/05` §5, §1 |
| 31 | **Nothing static over ~1 s, and a hold beat isn't "dead"** — covered by #26 (re-verify after any re-time). | Re-check contact sheet after the final timing pass | A re-time accidentally created a 1.5 s dead hold | `references/04` §3, `references/08` §2 |
| 32 | **Cut to the next shot has *something* on screen at frame 0** — start a pop at t+3, never t-1. No empty-frame cut at any scene transition. | Grep each scene's first frame: an element is visible at t=0 (a background is drawn before the first character pop); the pop keyframe is `≥ t+3` after the cut | A hard cut to a blank frame is a visible glitch — the single most embarrassing ship defect | `references/07` §6, `references/05` §4 |

## (e) Technical export

| # | CHECK | HOW | FAILS | SEE |
|---|---|---|---|---|
| 33 | **The MP4/GIF file plays** — it opens in a real player, first frame is not black/blank. | `ffprobe out/animation.mp4` (streams, dimensions, frame count all present); open the first 0.5 s in a browser/player; frame 0 is the actual first pose, not a black frame | A black first frame = fonts/assets not loaded at capture start, or the seek wrote frame 0 before `__ready()` | `references/10` §2, §7 |
| 34 | **MP4 is playable everywhere:** `-pix_fmt yuv420p` (even color subsampling) and `-movflags +faststart` are present in the encode. | `ffprobe -show_streams out/animation.mp4` → `pix_fmt=yuv420p`; the moov atom is at the front (`+faststart`) | Some players (notably older ones / certain web players) won't play a 4:4:4 H.264 stream; without `+faststart` the file won't stream, it downloads first | `references/10` §3 |
| 35 | **GIF file size is sane: < 5 MB for a 1080p 8 s clip.** If over, drop to 720 px width or 12 fps and re-stitch — don't just accept the size. | `ls -l out/animation.gif` → under 5 MB; confirm the two-pass palette (`palettegen` + `paletteuse`, `stats_mode=diff`) was used so line art doesn't band | A 1080p GIF can hit 10–20 MB (3–5× the cap); without the two-pass palette, black line art on a white background flickers/bands | `references/10` §3, §4 |
| 36 | **GIF uses two-pass palettegen/paletteuse** (not a naive single-pass), with `stats_mode=diff` and Floyd–Steinberg dither. | Grep the GIF encode command for `palettegen` + `paletteuse` + `stats_mode=diff` + `dither=floyd_steinberg` | A naive single-pass GIF on line art = visible color banding and per-frame flicker on the black strokes | `references/10` §3 |
| 37 | **Determinism held at capture** — the built-in frame-0 double-capture diff passed (byte-identical). Re-run the capture once more; the same frame must be the same PNG. | Re-run `node scripts/capture_frames.mjs` and diff two frame-0 PNGs; `cmp frame-0000a.png frame-0000b.png` → identical | Frame 0 differs between runs = a wall-clock leak (`Math.random`, `Date.now`, `performance.now`) in the scene; the contact sheet is not reproducible | `references/10` §1–2, `references/12` trap (f) |
| 38 | **All on-screen numbers are sourced** (a `science` entry: claim, working, source) — no invented statistics. | Grep `story.json` `science[]`; every on-screen number has a matching entry | An unsourced number undermines the whole "checked fact" credibility of the turn beat | `references/07` §6, `references/09` |
| 39 | **Audio (if any) is −14 LUFS integrated, true-peak ≤ −1.0 dBTP, muxed with `+faststart` and `-shortest`.** | If `story.json` has `audio`: run the two-pass `loudnorm` and `ffprobe` the final; if no `audio` key, confirm the file is intentionally silent | A too-loud or clipping mix; an audio tail longer than the video; or a missing audio track that should have been there | `references/09` §2, §6 |

---

## How to run this (agent workflow)

1. **Reproduce:** re-run the capture, confirm #24 and #37 (determinism) first — everything below assumes a reproducible frame set.
2. **Contact sheet:** generate it, open it full-size. Items #1, #6–15, #16–23, #26–32 are read *off the contact sheet* — go through it once, top to bottom.
3. **Greps:** items #1, #2, #3, #6, #24, #28–37 have a grep command in the HOW column — run them literally, they're fast and catch what the eye misses.
4. **Play the file:** #33–#35 — open the actual MP4/GIF, don't trust the contact sheet for "does it play / is it black / is it too big".
5. **Fail an item → read the SEE column → fix → re-run that check.** Do not batch-fix and re-check all at once; the contact sheet changes when you fix one thing.
6. **Only ship when all 39 items pass.** Record any UNVERIFIED number you had to guess at (per `references/00-source-index.md`), and note it in the step-10 report.

---

## Cross-references

- `references/03` — rig, gait, moonwalk formula, cast sheet (items 1, 6, 7, 8, 9, 10, 15, 27)
- `references/04` — pose library, walk table, trip/fall easing, hold pacing (items 7, 8, 9, 10, 11, 12, 16, 26, 29, 31)
- `references/05` — faces, blinks, face-swap timing (items 28, 30, 32)
- `references/06` — safe margins, z-order, contact shadows, shot rules (items 17, 18, 19, 20, 22, 23)
- `references/07` — duration/fps inference, position contract, "no empty frame" rule, sourced numbers (items 24, 32, 38)
- `references/08` — prop/hand rule, "life comes from around the character", collision (items 8, 12, 14, 19, 26, 31)
- `references/09` — audio loudness targets (item 39)
- `references/10` — determinism, capture, ffmpeg encode, fonts, file-size presets (items 24, 25, 33–37)
- `references/12` — trap-by-trap symptom → cause → fix, used when a check fails

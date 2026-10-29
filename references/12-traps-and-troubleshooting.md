# Traps & Troubleshooting

Symptom → Cause → Fix. Each entry is one failure mode with the fix, the
exact number or code where one exists, and the reference to the file that
explains the concept. Order: character/rig traps, motion traps,
composition traps, timing/loop traps, export/technical traps.

---

## A. Character & rig

**A1 — Character drifts / redraws differently per shot.**
Cause: a second, hand-written stick figure in one scene (or a copy-pasted
SVG block with different segment lengths), instead of calling the same rig.
Fix: one rig. `grep -rn "drawFigure\|solve(" out/` must return a single
source; every scene imports `library/js/rig.js` and draws via `solve(pose)`
+ `drawFigure`. Delete the hand-drawn figure. `references/03` §1, §11.

**A2 — Limbs are different lengths between two shots of the same character.**
Cause: the second scene hardcodes segment lengths instead of using the
shared `DEFAULTS` (thigh 35, shin 35, upperArm 28, …). Fix: pass a
`height` scale factor to `solve()` / `drawFigure()`, never new segment
lengths. `references/03` §1.

**A3 — A costume/look "breaks" alignment with the head (the hat floats off).**
Cause: the extra element is drawn from its own hardcoded coordinates.
Fix: a costume is a set of overrides on the *same* rig, and any extra
element (hat, scarf) is computed from the same `solve(pose)` result (e.g.
attach a hat to `p.headCenter`), so it can never drift. `references/03`
§10.

**A4 — A floating hand / a grab that misses the object.**
Cause: FK-only reach — the hand's keyframed angle doesn't land on the
prop. Fix: use IK where there's a target: `ik2(root, target, L1, L2,
sign)` with the prop's handle as `target`. Without the snap, hands miss.
`references/03` §4–5, `references/04` §2 reach/grab.

**A5 — A hyperextended / backwards knee on a walk or hold pose.**
Cause: the back leg's `lower` angle exceeds ~60° (reads as a broken
rig) or a knee bends past ~90°. Fix: clamp the walk beats to the table in
`references/04` §1 (back-leg `lower` ≤ 60°); QA item "no joint
hyperextension" is a fail at ~90° at the knee. `references/04` §1 rule 4,
`references/11` item 7.

**A6 — Two characters blink in sync.**
Cause: both use the same `blinkPeriod` (both close eyes on frame N).
Fix: stagger the periods with different primes — hero 150 frames, side
character 190 — so they drift out of phase for the whole scene.
`references/05` §2, `references/11` item 28.

**A7 — Second character is unreadable / looks like the first.**
Cause: same `height` and same `color` on both. Fix: scale the second to
~0.7× of the first (child/sister), give it a distinct color or head fill
so the silhouettes differ. `references/03` §9.

---

## B. Motion

**B1 — Feet skate / the "moonwalk bug" in a run-in-place.**
Cause: the world scroll speed doesn't equal the foot's sliding speed, so
the planted foot slides across the ground. Fix: `scroll = stride ×
cadence ÷ duty` — walk ≈ 106 u/s, run ≈ 383 u/s. The common mistake is
`stride × cadence` (dropping the duty factor), which makes the stance
foot drift. `references/03` §7, `references/04` §1 rule 2.

**B2 — A walking figure "glides on rails" (no vertical movement).**
Cause: the hip bob is missing. Fix: add `bob` following `−|sin(phase·2π)|`
(two dips per cycle, one per step). `references/04` §1 rule 3,
`references/03` §6.

**B3 — A walk reads as waddling.**
Cause: both arms swing with both legs. Fix: counter-swing — the arm on
the *same side* as the back leg swings forward (the `walkPose` default
does this). `references/04` §1 rule 1.

**B4 — A thrown object travels in a straight line.**
Cause: single keyframe start→end with no arc. Fix: add a mid keyframe
10–20 px perpendicular above the straight line (or let `walkPose`
produce the arc naturally). Linear spin over the flight is the *only*
allowed linear. `references/01` §7, `references/08` §1 rules.

**B5 — A landing has no weight (the character floats onto the ground).**
Cause: no squash. Fix: stickman squash is at the *legs* (knees tuck,
hips drop) — hold the squashed pose 2 frames, spring back over 4–8
frames with `power2Out`. Do not scale the whole figure. `references/01`
§1, `references/03` §8.

**B6 — A big move (jump/throw) with no wind-up; the object teleports.**
Cause: no anticipation keyframe. Fix: add a crouch/lean-back/wind-up
keyframe 100–200 ms (6–12 frames @30fps) before the launch key, at
10–20 % of the launch amplitude. `references/01` §2, `references/04`
§2 jump/throw.

**B7 — A trip/fall looks like the character was *punched*, not
gravity-caught.**
Cause: the fall eases *out* (decelerating into the ground). Fix: falling
must ease *in* — the torso's 90° rotation over 10–12 frames uses
`power2In` (accelerating, gravity). Gravity is never ease-out.
`references/04` §2 trip/fall, `references/08` §3, `references/11` item 12.

**B8 — A stop reads as a render stall (the figure freezes dead).**
Cause: the last keyframe has no settle. Fix: every hard stop gets a
50–100 ms (2–3 frame) settle/spring after it. `references/01` §12,
`references/02` §8.

---

## C. Composition

**C1 — Z-order bug: a limb is drawn over the torso it should be behind
(the figure reads as deformed).**
Cause: draw order is wrong. Fix, at the scene level: within a character,
draw far limbs → torso → near limbs → head; scene: background → far
props → characters (sorted by y) → near props → foreground → FX. For a
character walking *behind* a bench: draw the figure, then the bench's
front legs over it, then re-draw the figure's near-side limb.
`references/06` §8, `references/11` item 18.

**C2 — A prop next to a hand reads as *part of* the hand.**
Cause: no clear space around the hand; the prop is drawn small, at hand
scale, in a similar color/line. Fix: keep clear space around every hand;
in an insert/macro shot, scale the prop up *hard* (6–10×) with blurred
edges. `references/08` intro + §1, `references/06` §7 macro insert,
`references/11` item 19.

**C3 — Text touches the frame edge / gets cropped by the player UI.**
Cause: text outside the title safe (80 %) or in the bottom 15 %. Fix:
keep all words inside x 384–1536, y 216–864 at 1080p; never place text
below y 918. `references/06` §2, `references/11` item 17.

**C4 — A cut lands on an empty frame at a scene transition (hard glitch).**
Cause: the next shot's first element is keyed *before* the cut (a pop at
t−1). Fix: every shot must have *something* on screen at frame 0 (the
background draws first); start any pop at t+3, never t−1.
`references/07` §6, `references/05` §4, `references/11` item 32.

**C5 — A hold beat is "dead" (1 s+ of zero motion; the clip looks frozen
or broken).**
Cause: a static hold with nothing moving around the character. Fix: add
ambient motion per the "life comes from around the character" rule —
dust, a lamp flicker, a tree sway ±2° at 0.3 Hz, or a slow camera
push-in (zoom 1.0→1.6 over 60–120 frames). The only sanctioned still is
the 10-frame "realisation" hold. `references/08` §2, `references/04` §3
pacing rule, `references/11` item 26.

**C6 — Two adjacent cuts are the same size and angle (reads as a skipped
beat / a freeze).**
Cause: wide→wide or medium→medium in sequence. Fix: vary size AND angle
every cut (wide→medium is fine, wide→wide is not). `references/06` §7,
`references/07` §8.

**C7 — A scene reads as a flat "everything floats" 2D image (no ground
read).**
Cause: standing objects have no contact shadow. Fix: every standing
object gets a dark ellipse (0.15–0.25 alpha, 1–2 px tall) where it
meets the ground line (y≈950 at 1080p). `references/06` §3, `references/11` item 20.

---

## D. Technical / rendering (these are the ones that cost an hour)

**D1 — SVG `transform-origin` bug: rotating an SVG element with CSS
`transform: rotate()` spins it around the SVG's top-left corner, not the
element's center.**
A real, well-known bug. Cause: CSS transforms on SVG elements default
`transform-box` to the SVG canvas's origin (0,0), so `rotate()` orbits
the element around the top-left of the whole SVG. Fix, either:
- add `transform-box: fill-box; transform-origin: center;` on the SVG
  element (rotate around the element's own bounding-box center), or
- use SVG's own `transform` attribute with an explicit center:
  `transform="rotate(a, cx, cy)"`.
Mark: **CONFIRMED, well-known** (the classic MDN/CSS-SVG interop
gotcha). `references/06` §4 for which element it matters on.

**D2 — CSS vs SMIL vs JS-driven animation: picking the wrong one makes
capture non-deterministic.**
When to use which:
- **JS-driven (our default):** the template exposes `window.__seek(frame)`;
  the capture script seeks a pure-function-of-frame `Timeline`. Best for
  deterministic capture — frame N is always the same pixels.
- **CSS keyframes / WAAPI:** pausable and seekable via
  `document.getAnimations()` + `a.currentTime = T` (ms). Deterministic
  too, because the wall clock is frozen.
- **SMIL (`<animate>`):** still works in all modern browsers (Chrome,
  Firefox, Safari — UNVERIFIED for Edge's headless shell; test it), but
  it is *not* seekable via `getAnimations()` the way CSS/WAAPI is, so
  you can't capture it deterministically by seeking. **For deterministic
  capture, prefer CSS keyframes or the JS seek path — not SMIL.**
`references/10` §1–2.

**D3 — Non-deterministic timeline: `Math.random` / `Date.now` /
`performance.now` in a shot → different pixels every capture.**
Cause: the scene isn't a pure function of (time, seed). Fix: remove all
three (`grep -n "random\|Date.now\|performance" out/*.html`); where
randomness helps (scattered sparks/dust/confetti), use the seeded hash
pattern from `effects.js`: `hash(seed, i)` is a deterministic
pseudo-random in [0,1), so the same frame always produces the same
pixels. Re-run the capture and the frame-0 double-diff must be
byte-identical. `references/08` §5, `references/10` §1–2,
`references/11` item 37.

**D4 — Font loading in headless render: frame 0 is in a fallback font.**
Cause: a CDN `@font-face` isn't loaded by the time the first screenshot
is taken, so frames 0–3 render in the fallback and later frames in the
real font — a visible "text jump" in the first 0.2 s. Fix: wait on
`document.fonts.ready` before the first screenshot (the template's
`window.__ready()` does exactly this), or use *system fonts only*
(`system-ui`, `ui-monospace`/Consolas/Menlo for the schematic look).
Note: a Google Fonts URL will silently fall back when rendering
*offline* — the render succeeds but in the wrong font.
`references/10` §7, `references/11` item 33.

**D5 — Headless first frame is blank (assets/fonts not loaded yet).**
Cause: the screenshot is taken before the scene has finished loading its
assets, so frame 0 is an empty canvas. Fix: the `__ready()` handshake —
the template sets `window.__ready()` on the first frame after assets +
fonts are loaded; the capture script waits for it (step 3 of
`capture_frames.mjs`) before the loop starts. If frames 0–2 are still
blank, the handshake fired too early — add a 300 ms settle after
`load`. `references/10` §2, `references/11` item 33.

**D6 — GIF banding / flicker on black line art.**
Cause: a naive single-pass GIF encode picks a static palette, so the
black strokes and white background get shared/quantized badly and the
line art bands or flickers frame-to-frame. Fix: two-pass
`palettegen` (with `max_colors=196`, `stats_mode=diff` so the palette
weights toward *changing* frames, which stops motion banding) then
`paletteuse` with `dither=floyd_steinberg`. `references/10` §3,
`references/11` item 36.

**D7 — MP4 won't play in some players (or won't stream).**
Cause: missing `-pix_fmt yuv420p` (H.264 baseline/MAIN wants even
color subsampling; a 4:4:4 stream breaks some players) and/or missing
`-movflags +faststart` (the moov atom stays at the end, so the file
must fully download before it plays). Fix: encode with
`-c:v libx264 -pix_fmt yuv420p -movflags +faststart` (CRF 18 for line
art, `scale=…:flags=lanczos` — never bilinear, which turns 4 px lines
into 3 px mush). `references/10` §3, `references/11` item 34.

**D8 — GIF is way too big (1080p → 10–20 MB, 3–5× the cap).**
Cause: exported at 1080p width / 30 fps. Fix: a GIF targets 12–15 fps
and 720 px width (~1 MB). If it's over ~5 MB for a 1080p 8 s clip, drop
to 720 width or 12 fps and re-stitch. `references/10` §3–4,
`references/11` item 35.

**D9 — Re-running the capture gives *different* pixels (not
reproducible).**
Cause: a wall-clock leak (`Math.random`, `Date.now`,
`performance.now`) survived in the scene — see D3. Confirm with the
frame-0 double-capture diff; if it fails, the contact sheet is not
reproducible and no later QA is trustworthy. `references/10` §1–2,
`references/11` items 24, 37.

---

## E. Story / content

**E1 — An on-screen number is invented (no source).**
Cause: a "fact" in the turn beat has no `science` entry. Fix: every
on-screen number gets a `science` object (claim, working, source) in
`story.json` — the credibility of the clip *is* the checked number.
`references/07` §6, `references/11` item 38.

**E2 — The clip ends mid-motion instead of on a held pose.**
Cause: the last beat is a move, not a hold. Fix: end on a held pose,
8–12 frames (the "realisation" hold is the only sanctioned still).
`references/07` §8, `references/04` §3.

**E3 — Shot count / duration doesn't match the inferred spec.**
Cause: beats weren't cut to the inferred `duration × fps` total. Fix:
total frame count must equal `duration × fps` (re-time the cuts to fit;
if over, *cut beats*, don't speed up). `references/07` §3, §8,
`references/11` item 24.

---

## Quick index (trap → section)

| Trap | Section |
|---|---|
| Character drifts per shot | A1 |
| Limb lengths differ | A2 |
| Costume misalignment | A3 |
| Floating / missing hand | A4 |
| Hyperextended knee | A5 |
| Synced blinks | A6 |
| Unreadable second character | A7 |
| Moonwalk / foot skate | B1 |
| No hip bob ("rails") | B2 |
| Waddling walk | B3 |
| Straight-line throw | B4 |
| No landing weight | B5 |
| No anticipation | B6 |
| Fall looks "punched" (wrong ease) | B7 |
| Dead stop | B8 |
| Z-order limb over torso | C1 |
| Prop reads as hand | C2 |
| Text off the safe margin | C3 |
| Empty-frame cut | C4 |
| Dead 1 s+ hold | C5 |
| Same-size adjacent cuts | C6 |
| No contact shadow | C7 |
| SVG `transform-origin` rotate bug (CONFIRMED) | D1 |
| CSS vs SMIL vs JS seek (determinism) | D2 |
| `Math.random`/`Date.now` non-determinism | D3 |
| Frame-0 fallback font | D4 |
| Blank headless first frame | D5 |
| GIF banding/flicker | D6 |
| MP4 won't play / won't stream | D7 |
| GIF too big | D8 |
| Non-reproducible capture | D9 |
| Unsourced on-screen number | E1 |
| Ends mid-motion | E2 |
| Shot count ≠ duration×fps | E3 |

Each fix above points at the `references/NN` file that has the concept,
and at the `references/11-qa-checklist.md` item that re-checks it after
the fix. If a check still fails after the fix, re-read the reference
section — the number is probably wrong, not the method.

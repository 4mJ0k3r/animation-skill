# Rendering & Export

How a zero-dependency HTML animation becomes a deterministic MP4/GIF.
The whole pipeline: **HTML (seekable) → headless frames → ffmpeg →
MP4/GIF**, plus the optional Remotion upgrade.

> Verified against: stix's `scripts/capture.sh` (MIT, agent-browser +
> ffmpeg), Remotion docs (remotion.dev, verified 2026), ffmpeg 8.1.2
> (the version tested here). Commands below are the exact ones in
> `scripts/capture_frames.mjs` and `scripts/stitch.sh` in this repo.

---

## 1. The determinism contract (read this first)

A frame is a **pure function of (time, seed)**. No `Math.random()`, no
`Date.now()`, no `performance.now()`, no wall-clock. The capture script
opens the HTML once, seeks it to t=0,1,2,...N frames, screenshots each.
The Nth frame must be **byte-identical** every time you capture it —
that's what makes the contact sheet reproducible and the whole
"verify your own output" step possible.

In HTML/CSS/SVG, determinism comes from **pausing and seeking CSS
animations** (the stix approach):

```js
// Open the scene, then for each frame:
document.getAnimations().forEach(a => a.pause());          // freeze the wall clock
document.getAnimations().forEach(a => { a.currentTime = T }); // seek to exact ms
// ...screenshot...
```

`document.getAnimations()` returns **every** running CSS/WAAPI
animation on the page (verified against MDN Web Animations API).
Setting `a.currentTime = T` (ms) and then screenshotting is the entire
capture mechanism. No `sleep()` in the loop — the sleep is only once,
at page load, so fonts and layout settle.

If you use **JS-driven** rendering (our default `library/js/` templates
render every frame from a `Timeline.seek(frame)` call), you seek it
differently: the template exposes `window.__seek(frame)`, and the
capture script calls `page.evaluate(f => window.__seek(f), frame)`
before each screenshot. Both paths end at the same place: **the frame
number is the only input**.

## 2. Frame capture (Playwright path, the default)

`scripts/capture_frames.mjs` (Node + Playwright, the one in this repo):

```
npx playwright install chromium          # once, per machine (~120MB)
node scripts/capture_frames.mjs \
  --scene examples/01-wave-hello/out/scene.html \
  --fps 30 --duration 8 \
  --out out/frames/
```

What it does, step by step (this is what the file does — read it, it's
~120 lines):
1. Launch headless Chromium (`chromium_headless_shell`, 1920×1080,
   `deviceScaleFactor: 2` for crisp lines).
2. `page.goto('file://...')`, wait for `load` + a 300ms settle (fonts).
3. Call `window.__ready()` (the template sets it on first frame) —
   the scene must report it has loaded its assets, or frames 0-2 will
   be blank.
4. Loop `f = 0 .. fps*duration-1`:
   - `page.evaluate(fr => window.__seek(fr), f)` — seek the JS
     timeline, OR pause+set `currentTime` for a pure-CSS scene.
   - `page.screenshot({ path: out/frame-0004.png, type: 'png' })`.
   - 4-digit zero-padded frame numbers (ffmpeg's `%04d` pattern).
5. Report frame count + output dir.

**Determinism check built in**: it captures frame 0 twice and diffs
the PNGs (byte-identical = pass; the two-pass diff is what "same frame
twice = identical pixels" means). If they differ, the template has a
wall-clock leak — find it (`grep -n "random\|Date.now\|performance"` in
the scene file).

## 3. Stitching: frames → MP4 + GIF (ffmpeg)

`scripts/stitch.sh` (in this repo) wraps the two exact commands:

**MP4** (1080p, H.264, the settings below are verified with ffmpeg 8.1.2):
```bash
ffmpeg -y -framerate "$FPS" -i frames/frame-%04d.png \
  -vf "scale=1920:1080:flags=lanczos" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -movflags +faststart out/animation.mp4
```
- `-pix_fmt yuv420p`: REQUIRED for H.264 to be playable everywhere
  (H.264's baseline/MAIN profile wants even color subsampling; 4:4:4
  breaks some players).
- `-crf 18`: visually lossless for a line-art stickman (crf 23 is
  fine for anything more photographic; crf 18 keeps thin 4px lines
  from shimmering).
- `-movflags +faststart`: moves the moov atom to the front → the MP4
  streams / starts playing before fully downloaded.
- `scale=1920:1080:flags=lanczos`: if you captured at a different
  resolution, downscale with lanczos, never bilinear (bilinear makes
  4px lines into 3px mush).

**GIF** (two-pass palette — the only way a line-art GIF doesn't
flicker, per the Remotion issue #1276 discussion, verified):
```bash
ffmpeg -y -framerate "$FPS" -i frames/frame-%04d.png \
  -vf "fps=12,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=196:stats_mode=diff[p];[s1][p]paletteuse=dither=floyd_steinberg" \
  -loop 0 out/animation.gif
```
- `fps=12`: GIFs are 12-15fps; 30fps GIFs are 2.5× the size for
  imperceptible smoothness.
- `scale=720:-1`: a 1080p GIF is 3-5MB; 720p is ~1MB. (stix's
  capture uses width 800, fps 8, the same idea at even lazier
  settings — that's for *previews*.)
- `palettegen max_colors=196` (leave 4 for transparency + a few
  reserved), `stats_mode=diff` (weights the palette toward frames
  that *change*, so motion doesn't band), `floyd_steinberg`
  (the standard dither).
- If the two-pass command is too verbose to type, the one-liner that
  does it in a single filtergraph is in `stitch.sh` — copy that.

## 4. Resolution/FPS/bitrate presets

| Preset | Canvas | FPS | CRF | GIF width | Use |
|---|---|---|---|---|---|
| `preview` | 960×540 | 12 | 23 | 480 | cheap iteration |
| `standard` (default) | 1920×1080 | 30 | 18 | 720 | the export |
| `social` | 1080×1920 | 30 | 18 | 540 | Reels/Shorts |
| `crisp` | 1920×1080 | 60 | 16 | — | action-heavy, file size unimportant |

FPS: 24 for a "film" feel, 30 for standard, 60 only if the action is
fast *and* the viewer will watch on a phone at full res. 8-12fps is
what stix ships for stickman *previews* — stick figures at 8fps look
intentionally loopy (drawn-animation style). **Pick one fps for the
whole clip** and record it in `story.json`; a 30→12 fps mid-clip
switch is a visible speed jump.

## 5. The Remotion upgrade (optional, heavier path)

When you need *audio synced to frame* (voice + SFX on a timeline),
Remotion is the upgrade (MIT-licensed core, verified against
remotion.dev 2026):

```bash
npx create-video my-anim        # scaffold
cd my-anim
# move your scenes into src/; each shot is a React component where
# `const frame = useCurrentFrame()` and `const {fps} = useVideoConfig()`
npx remotion render src/index.tsx MyComp out/anim.mp4
npx remotion render --codec=gif src/index.tsx MyComp out/anim.gif
```

- Remotion renders by **evaluating the component per frame** with that
  frame's number — the determinism contract is the framework's job,
  not yours. Every frame is a pure function of `useCurrentFrame()`.
- `@remotion/gsap` (verified: official package, v4.0.539, MIT, merged
  2026-08) makes GSAP timelines deterministic in Remotion:
  `useGsapTimeline()` builds a *paused* timeline and seeks it to
  `frame/fps` — the wall-clock ticker is never running. If you use the
  GSAP template, this is the bridge to the Remotion path.
- GIF: `--codec=gif` (native) or the two-pass ffmpeg (better, and
  what this repo's `stitch.sh` does). `--every-nth-frame=2` halves the
  GIF fps.
- License: Remotion is free up to ~10k monthly views on *commercial*
  projects; the code in your repo is yours. If you're building a
  product on top of Remotion, read `remotion.dev/docs/license` before
  shipping (this is a Remotion-licensing detail, not a repo one —
  marked UNVERIFIED-exact-number until you check the current page).

## 6. The full pipeline, one screen

```
story.json + prompt
   │  (steps 1-6 of SKILL.md: script, beats, assets, storyboard, QC)
   ▼
out/scene.html  (seekable, deterministic, tested in a real browser)
   │  node scripts/capture_frames.mjs --scene out/scene.html --fps 30
   ▼
out/frames/frame-0000.png ... frame-NNNN.png  (determinism diff passes)
   │  bash scripts/stitch.sh out/frames out/ 30 both
   ▼
out/animation.mp4 + out/animation.gif
   │  (optional: python scripts/contact_sheet.py out/frames 8x8 out/contact.jpg)
   ▼
final QA on the contact sheet (references/11), then report (step 10)
```

Every arrow in that diagram is a script in `scripts/` that you can run
without reading the file — the flags are above. The only manual step
in the whole pipeline is **looking at the contact sheet** (and the
storyboard stills in step 5).

## 7. Fonts, in headless browsers (the one trap that costs an hour)

Headless Chromium loads `system-ui`/`sans-serif` from the OS font
stack. Two failures:
1. **Font not loaded on frame 0**: a `@font-face` from a CDN means
   frames 0-3 render in a fallback and later frames in the real font
   = a visible "text jump" in the first 0.2s. Fix: wait on
   `document.fonts.ready` before the first screenshot (the template's
   `window.__ready()` does exactly this), or use only system fonts
   (system-ui, and for the "schematic" look, ui-monospace/Consolas/
   Menlo).
2. **Offline render**: Google Fonts needs a network. Offline, the
   render *succeeds* but in the fallback font, silently. If you must
   work offline, drop a font file in `public/fonts/` and reference it
   locally (what-if's traps list: "Google Fonts need a connection at
   render time").

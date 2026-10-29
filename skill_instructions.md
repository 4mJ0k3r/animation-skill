# Stickman Animation Skill Instructions

This document provides complete instructions for executing the 10-step stickman animation pipeline.

---

## 1. Zero-Install Architecture

Animations are authored as self-contained HTML files using ES modules:
- No npm dependencies required at runtime or authoring.
- No bundler, Babel, or Webpack.
- The five core library files must sit in the same folder as the scene HTML:
  - `rig.js`: FK & IK skeleton solver, pose blending, procedural walk/run cycles.
  - `timeline.js`: Pure-function deterministic keyframe track.
  - `easing.js`: Penner curves, cubic beziers, and damped spring physics.
  - `camera.js`: Pan, zoom, deterministic noise shake, parallax coordinate mapping.
  - `effects.js`: Seeded pseudo-random hash, speed lines, impact bursts, dust puffs, text pops.

---

## 2. Character Specification & Rig Math

The character rig uses Y-up local coordinates centered at the hip `(0, 0)`.
Default segment proportions (`DEFAULTS` in `rig.js`):
- `headR`: 16 px (diameter 32)
- `neckLen`: 8 px
- `torsoLen`: 55 px
- `upperArm`: 28 px, `lowerArm`: 28 px (total arm 56 px)
- `thigh`: 35 px, `shin`: 35 px (total leg 70 px)
- Total height: 142 px (default normalization scale)

On a standard 960×960 canvas:
- Character height: 320 px (scale factor ≈ 2.25)
- Stroke width: 7 px
- Color: `#1c1c1c`
- Facing: `1` (right), `-1` (left)

For secondary characters:
- Scale height to ≈ 0.7× (e.g. 224 px)
- Stroke width: 5 px
- Distinct accent color (e.g. `#0984e3` blue or `#e17055` orange)

---

## 3. Locomotion & Moonwalk Prevention

Locomotion is generated via `walkPose(phase, gait)` in `rig.js`:
- `phase`: cyclic 0..1 progress.
- `gait`: 0.0 (walk) to 1.0 (run).

Gait Parameters:
| Gait | Cadence (cycles/s) | Stride (px) | Step Height (px) | Stance Duty | Hip Bob (px) | Lean |
|---|---|---|---|---|---|---|
| Walk | 1.50 | 44 | 15 | 0.62 | 5 | 10° |
| Run | 2.55 | 60 | 26 | 0.40 | 12 | 24° |

**Moonwalk Speed Formula (`references/03` §7):**
To ensure the feet do not skate or slide on the ground:
$$\text{Speed} = \frac{\text{Stride} \times \text{Cadence}}{\text{Duty}}$$
- Walk: $44 \times 1.50 / 0.62 \approx 106.5\text{ px/s}$
- Run: $60 \times 2.55 / 0.40 \approx 382.5\text{ px/s}$

---

## 4. The Deterministic Capture Contract

Every scene file must implement the deterministic capture contract:
```javascript
window.__seek = (frame) => drawFrame(Math.max(0, Math.floor(frame)));
window.__ready = () => new Promise((resolve) => {
  window.__stopPreview();
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
    .then(() => { drawFrame(0); resolve(); });
});
```
- In headless Chromium, `scripts/capture_frames.mjs` sets `window.__capturing = true` before navigation, canceling any interactive `requestAnimationFrame` loop.
- It seeks each frame `f = 0 .. (fps * duration - 1)` sequentially and takes a screenshot.
- Frame 0 is captured twice and compared byte-for-byte. If `hash(frame_0_A) !== hash(frame_0_B)`, capture halts immediately to prevent shipping non-deterministic animations.

---

## 5. Stitching & Output Standards

Run ffmpeg via `scripts/stitch.sh` or `scripts/stitch.mjs`:
- **MP4:** 1080p (or 1080×1080 square / 1080×1920 reel), H.264 `libx264`, slow preset, CRF 18, `yuv420p` pixel format, `+faststart` flag.
- **GIF:** 720p max, 12 fps, two-pass palette generation with `palettegen=max_colors=196:stats_mode=diff` and Floyd-Steinberg dithering.

---

## 6. Verification & Quality Gates

Before finalizing an animation:
1. Run `python scripts/contact_sheet.py <frames_dir> 8x8 <out_contact.jpg>`
2. Inspect the 64-cell grid for:
   - Silhouette readability at 40% zoom.
   - Ground contact continuity (feet plant firmly, no vertical oscillation through floor).
   - Facing continuity across scene cuts.
   - Sourced numbers in `story.json` matching on-screen text.

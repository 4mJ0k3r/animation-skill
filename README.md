# Stickman Animation Skill

A zero-install, deterministic 2D stickman animation agent skill pack. Transforms a one-line prompt into seekable HTML5 animations and high-definition MP4/GIF exports.

---

## Key Features

- **Zero-Install Runtime:** Default animations run entirely in vanilla JS + HTML5 Canvas. No npm modules, bundlers, or CDNs required.
- **Deterministic by Construction:** Every frame is a pure mathematical function of `frame` number. Same frame twice = identical pixels.
- **Single Character Rig:** `library/js/rig.js` provides analytical two-bone IK, forward kinematics, and procedural locomotion (`walkPose`) eliminating character drift.
- **Deterministic Headless Capture:** Playwright Chromium headless capture with built-in double-capture verification.
- **Professional FFmpeg Stitching:** 1080p H.264 MP4 (CRF 18, `+faststart`) and two-pass palette-diff GIF export.
- **Full QA Pipeline:** Contact-sheet visual inspection grids (`contact_sheet.py`), position contract validation (`validate_story.mjs`), and preflight environment checks (`preflight.sh`).

---

## Directory Structure

```
animation-skill/
├── SKILL.md                     # Agent skill entry (<150 lines, trigger frontmatter)
├── skill_instructions.md        # Detailed pipeline reference
├── README.md                    # Project overview & documentation
├── LICENSE                      # MIT License
├── ATTRIBUTION.md               # Mirror of references/00 with snippet-level credits
├── CONTINUATION.md              # Project history, verified state, design decisions
├── package.json                 # Dev dependencies (playwright)
│
├── library/
│   ├── js/                      # Core runtime engines (ES modules)
│   │   ├── rig.js               # Skeleton FK/IK solver & walk/run gait
│   │   ├── timeline.js          # Deterministic keyframe track
│   │   ├── easing.js            # Easing curves, beziers, springs
│   │   ├── camera.js            # Pan, zoom, shake, parallax
│   │   └── effects.js           # Deterministic FX (speedlines, dust, impacts, text pop)
│   ├── svg/                     # Rig-derived SVG assets (characters, poses, faces, props)
│   └── threejs/                 # Optional WebGL orthographic 2D engine
│
├── templates/
│   ├── single-scene.html        # Workhorse single-scene canvas template
│   ├── multi-scene.html         # Multi-scene template with transitions
│   ├── gsap-timeline.html       # Paused GSAP timeline template
│   ├── remotion-starter/        # Remotion video starter
│   ├── story.schema.json        # JSON Schema for story.json
│   └── story.example.json       # Reference story.json
│
├── scripts/
│   ├── preflight.sh / .mjs      # Environment checks (Node, ffmpeg, python, playwright)
│   ├── capture_frames.mjs       # Headless Chromium frame capture
│   ├── stitch.sh / .mjs         # FFmpeg MP4 & GIF stitchers
│   ├── contact_sheet.py         # Pillow 8x8 contact sheet generator
│   ├── validate_story.mjs       # story.json contract validator
│   └── generate_svg_library.mjs # Rig-to-SVG asset exporter
│
├── references/                  # Deep technical documentation (00 to 12)
│   ├── 00-source-index.md       # Upstream source index and link hub
│   ├── 01-animation-principles.md
│   ├── 02-timing-easing-tables.md
│   ├── 03-character-rig.md
│   ├── 04-pose-and-motion-library.md
│   ├── 05-expressions-and-acting.md
│   ├── 06-scene-composition.md
│   ├── 07-storytelling-and-shots.md
│   ├── 08-props-and-effects.md
│   ├── 09-sound-and-sync.md
│   ├── 10-rendering-and-export.md
│   ├── 11-qa-checklist.md
│   └── 12-traps-and-troubleshooting.md
│
└── examples/
    ├── 01-wave-hello/           # Single-scene 2s wave animation
    ├── 02-chase/                # Two-scene 6s sprint chase with match cut
    └── 03-explainer-what-if/    # Three-scene 16s science explainer
```

---

## Quick Start

### 1. Verify Prerequisites
```bash
node scripts/preflight.mjs
# or: bash scripts/preflight.sh
```

### 2. Run an Example
```bash
# Capture frames
node scripts/capture_frames.mjs --scene examples/01-wave-hello/scene.html --fps 30 --duration 2 --out out/01/frames

# Stitch to MP4 and GIF
node scripts/stitch.mjs out/01/frames out/01 30 both

# Generate contact sheet
python scripts/contact_sheet.py out/01/frames 8x8 out/01/contact.jpg
```

---

## Examples

- **01 Wave Hello:** Single stickman standing, waving to camera, returning to neutral. Demonstrates discrete facial swaps without morphing and ease-in-out limb movement.
- **02 The Chase:** Multi-character scene. Hero pursued by faster secondary character (0.7× scale, blue). Demonstrates procedural running gait (`walkPose`), dust particles, dynamic camera shake, and match-cut continuity.
- **03 What If You Jumped Off The Earth?:** 16-second explainer animation following the 7-beat structure. Demonstrates vertical launch, speed lines, space scene with seeded star field, HUD calculations, and NASA-sourced science.

---

## License

MIT License. See [LICENSE](LICENSE) and [ATTRIBUTION.md](ATTRIBUTION.md) for details on upstream sources and techniques.

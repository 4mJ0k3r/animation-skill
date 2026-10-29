# Attribution & Upstream Sources

This repository synthesizes, adapts, and builds upon several open-source agent skills, libraries, and animation techniques. Every copied, adapted, or paraphrased snippet is credited below with its upstream license and specific usage.

---

## 1. Upstream Projects & Source Index Mirror

| Project / Source | Upstream License | Usage in this Repo | Upstream URL |
|---|---|---|---|
| **kelano86/what-if-animation** | MIT | Pipeline structure (SKILL.md), 7-beat what-if narrative formula (`references/07`), storyboard-before-animation rule, seeded pseudo-random hash pattern (`effects.js`), traps checklist (`references/12`). | [github.com/kelano86/what-if-animation](https://github.com/kelano86/what-if-animation) |
| **bassimeledath/stix** | MIT | Reusable asset philosophy, 8s default scene length, position contract in `story.json`, exact ffmpeg stitching commands (`references/10` and `scripts/stitch.sh`), pause-and-seek determinism contract (`references/10` §1). | [github.com/bassimeledath/stix](https://github.com/bassimeledath/stix) |
| **LottieFiles/motion-design-skill** | MIT | Timing tables, easing tables, Disney 12 principles adapted for digital characters (`references/01`, `references/02`), quality ship gates (`references/11`). | [github.com/LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) |
| **ShengyuStudio Devlog** (2026-10-16) | Article / Technique | Two-bone law-of-cosines analytical IK solver (`ik2` in `library/js/rig.js`), procedural gait parameters (stride, cadence, duty, step height, hip bob in `walkPose()`), moonwalk speed formula (`references/03`). | [shengyugames.com/devlog/two-bone-ik-stick-figure-animation](https://shengyugames.com/devlog/two-bone-ik-stick-figure-animation) |
| **haidrrrry/claude-remotion-skill** | MIT | "Render → inspect stills → fix → re-render" mandatory verification loop, Remotion 10 rules. | [github.com/haidrrrry/claude-remotion-skill](https://github.com/haidrrrry/claude-remotion-skill) |
| **iart-ai/webgl-animation-skills** | MIT | Three.js orthographic 2D scene setup and render loop (`library/threejs/ortho-scene.html`). | [github.com/iart-ai/webgl-animation-skills](https://github.com/iart-ai/webgl-animation-skills) |
| **iart-ai/kinetic-typography-skills** | MIT | Kinetic type recipes, character pop formulas (`effects.js`). | [github.com/iart-ai/kinetic-typography-skills](https://github.com/iart-ai/kinetic-typography-skills) |
| **frankxai/awesome-motion-design-agent-skills** | CC0 1.0 | Motion design doctrine: "static hierarchy first", "design reduced-motion path", "verify on real devices". | [github.com/frankxai/awesome-motion-design-agent-skills](https://github.com/frankxai/awesome-motion-design-agent-skills) |
| **bestagentkits/motion-video-skill** | MIT | Audio loudness criteria (-14 LUFS, true-peak <= -1.0 dBFS) in `references/09`. | [github.com/bestagentkits/motion-video-skill](https://github.com/bestagentkits/motion-video-skill) |
| **@remotion/gsap** (v4.0.539) | MIT | Paused GSAP timeline seeked to `frame/fps` pattern (`templates/gsap-timeline.html`). | [remotion.dev/docs/gsap](https://www.remotion.dev/docs/gsap) |
| **Playwright** | Apache-2.0 | Headless Chromium capture engine with `deviceScaleFactor` DPR support (`scripts/capture_frames.mjs`). | [github.com/microsoft/playwright](https://github.com/microsoft/playwright) |
| **mrdoob/three.js** | MIT | Orthographic 2D WebGL rendering engine adapter (`library/threejs/`). | [github.com/mrdoob/three.js](https://github.com/mrdoob/three.js) |

---

## 2. Snippet-Level Attribution

- **Two-bone IK solver (`ik2` in `library/js/rig.js`):**
  Adapted from ShengyuStudio's law-of-cosines analytical 2-bone solver. Clamps hypotenuse to avoid `NaN` when target is unreachable, solving the joint angle in Y-up local coordinates.
- **Procedural Gait Table (`walkPose` in `library/js/rig.js`):**
  Walk parameters (cadence 1.5 cycles/s, stride 44px, step height 15px, stance duty 0.62, hip bob 5px) and run parameters (cadence 2.55 cycles/s, stride 60px, step height 26px, duty 0.40, hip bob 12px) sourced from ShengyuStudio's gait study.
- **FFmpeg Stitching Flags (`scripts/stitch.sh` & `references/10` §3):**
  - MP4: `-vf "scale=1920:1080:flags=lanczos" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart` (adapted from stix's `scripts/capture.sh`).
  - GIF: Two-pass palette filtergraph `fps=12,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=196:stats_mode=diff[p];[s1][p]paletteuse=dither=floyd_steinberg` (adapted from Remotion community best-practice and stix).
- **Deterministic Seeded Hash (`hash` in `library/js/effects.js`):**
  Adapted from kelano86/what-if-animation's seeded random pattern (`rnd(seed, i)`) ensuring deterministic render output without wall-clock leaks.

---

## 3. Reference-Only / Non-Copied Sources

- **filippocalippo/StykAnimate-App (GPL-3.0):** Ideas and architectural concepts only (joint hierarchy, IK model, dual timeline layers). **Zero lines of code** copied to maintain MIT compatibility.
- **madeindjs/stickman & wazabaki/isometric-spider:** Read for concepts (SMIL-only vs JS seek, threshold foot planting); no code copied.
- **levnik-b/stickyman:** Dead link (404), unverified; confirmed removed from all active sources.

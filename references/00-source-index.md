# Source Index (the link hub)

Every external source this skill pack drew from, verified 2026-10 (URL
resolves, repo is what it claims, licence checked in the repo's
LICENSE file or GitHub's licence badge). Copy-allowed = whether we may
adapt code from it (MIT/Apache/CC0/BSD = yes, keep the copyright
header and list it in `ATTRIBUTION.md`; GPL = no, link + summarize
only; none = no, ideas in our own words only).

Stars/last-update are point-in-time, 2026-10-29; re-verify before
copying new code.

---

## If you need X → go to Y

- Need **the whole pipeline shape** (script → storyboard → animate →
  verify)? → **kelano86/what-if-animation** (its SKILL.md is the
  closest structural template to ours).
- Need **the seekable-CSS scene + ffmpeg** pattern for stick figures
  specifically? → **bassimeledath/stix**.
- Need **the motion-theory numbers** (timing, easing, Disney
  principles for UI/character)? → **LottieFiles/motion-design-skill**.
- Need **deterministic GSAP-in-React video**? → **@remotion/gsap**
  docs + **haidrrrry/claude-remotion-skill**.
- Need **a stick rig you can steal the *idea* of** (joints, IK,
  pose)? → **filippocalippo/StykAnimate-App** (GPL: ideas only) and
  the ShengyuStudio two-bone-IK article (technique, not code).
- Need **kinetic type recipes**? → **iart-ai/kinetic-typography-skills**.
- Need **procedural walk/run without keyframes**? → `walkPose()` in
  our `library/js/rig.js` (derived from the ShengyuStudio gait
  table) and **twinji/walking-stick-figure** (MIT, reference only).

---

## A. Agent skills for animation (the structural models)

| Repo / URL | Licence | Stars & last update | What it's good for | Specific files to read or copy | Copy allowed? | Notes / caveats |
|---|---|---|---|---|---|---|
| kelano86/what-if-animation — github.com/kelano86/what-if-animation | MIT | 27 ★, 2026-10-21 | The closest structural template to our repo: root SKILL.md = the pipeline; `references/` = formula, look, checklists, traps; `studio/` = working Remotion project; `scripts/` = voice/plan/stills/board/sfx/mixcheck/master | `SKILL.md` (the 8-step pipeline, storyboard-before-animation rule), `references/look.md` (11-point storyboard self-check + motion check), `references/traps.md` (every failure that "cost real time"), `references/formula.md` (7-beat structure), `references/kit.md` (the rig's `poseAt`/`faceAt` API, sets, lighting/UI blocks) | **Y** — MIT, keep header, list in ATTRIBUTION.md | Remotion + ElevenLabs (paid) by default; we keep it *optional* in our pipeline and mark TTS [PAID]. 27★ but the most complete agent-animation pipeline we found. |
| bassimeledath/stix — github.com/bassimeledath/stix | MIT | 16 ★, 2026-03-01 | The "asset-first SVG" pipeline: characters/props are reusable SVGs; scenes position + add CSS `@keyframes`; 8s fixed scene duration; QC loop with 4 keyframe captures; frame capture by **pausing and seeking** CSS animations, then ffmpeg | `SKILL.md` (782 lines, the whole pipeline as an agent prompt), `library/poses.md` (16 named poses as SVG line coords, hip-at-origin), `library/transitions.md` (11 CSS `@keyframes` patterns), `library/style-guide.md` (900×400 viewBox, ground y=355, stroke 2.4), `references/qc-rubric.md` (the 4-category PASS/FAIL rubric), `scripts/capture.sh` (the agent-browser + ffmpeg exact commands) | **Y** — MIT | 8s-per-scene convention is its design, not a law; we keep it as the *default* scene length. `agent-browser` is a dep we don't ship — our `capture_frames.mjs` uses Playwright instead (Apache-2.0, and we vendor the binary via `npx playwright install`). |
| LottieFiles/motion-design-skill — github.com/LottieFiles/motion-design-skill | MIT | 2.6k ★, 2026-05-18 | The *theory* layer: 8-step checklist, motion-personality archetypes, duration/easing tables, Disney's 12 principles adapted for UI, emotion→motion map, quality checklist, troubleshooting | `skills/motion-design/SKILL.md` (315 lines — the short entry file, our model for ours), `director/disney-principles.md` (12 principles, numbers for each), `reference/timing-easing-tables.md` (the duration and bezier tables we transcribed into `references/02`), `reference/quality-checklist.md` (the 5-category checklist our `references/11` adapts), `reference/troubleshooting.md` (failure-mode → fix) | **Y** — MIT, 2.6k★ is the most-sourced motion-theory agent skill we found | UI-oriented by default; we've re-pointed its tables at character acting (walk/run cycle rows are ours, marked as such in `references/02`). |
| iart-ai/kinetic-typography-skills — github.com/iart-ai/kinetic-typography-skills | MIT | 16 ★, 2026-06-22 | Text-animation recipes: stagger patterns, split-text, variable-font, the `?t=N` freeze-harness verify loop | `skills/kinetic-typography/SKILL.md` and `references/reveal-recipes.md` | **Y** — MIT | The SKILL.md frontmatter (name + trigger-phrase description, `version: 0.1.0`) is the model for our own frontmatter. |
| iart-ai/manim-skills — github.com/iart-ai/manim-skills | MIT | 15 ★, 2026-06-22 | How a skill for a *different* engine is written short: deep references on demand, a "render a frame first" verify loop | `skills/manim/SKILL.md` | **Y** — MIT | Engine is Manim (Python), not ours; we take the *structure* (short SKILL.md + on-demand `references/`), not the code. |
| iart-ai/webgl-animation-skills — github.com/iart-ai/webgl-animation-skills | MIT | 24 ★, 2026-06-22 | Three.js scene/camera/GLTF patterns for agents: the render-loop shape, `clock.getDelta()` for frame-rate independence, GPU particle points | `skills/threejs-animation/SKILL.md` (minimal scene + render loop, camera lerp `1 - exp(-lambda*dt)`), `skills/particle-system/SKILL.md` | **Y** — MIT | Feeds our optional `library/threejs/` starter (orthographic 2D scene), `references/10` §5. |
| haidrrrry/claude-remotion-skill — github.com/haidrrrry/claude-remotion-skill | MIT | 698 ★, 2026-08-12 | "The 10 rules" for Remotion motion: never linear, 5-layer stack (bg mesh → assets → graphics → grade → grain), Ken Burns on every still, all timing derived from `fps`, a mandatory render→inspect→fix loop | `SKILL.md` (the 10 rules, each a hard constraint) | **Y** — MIT | The "render → inspect frames → fix → re-render, never ship unverified" loop is the exact verify step our pipeline's step 9 implements. |
| charlie947/motion-graphics-skills — github.com/charlie947/motion-graphics-skills | MIT | 462 ★, 2026-10-11 | 14 skills, the order you use them (brand-intake → plan → launch/explain → open/promote); the "say this" trigger-phrase table per skill | `skills/*/SKILL.md` (each has its trigger line) | **Y** — MIT | Brand-first: `brand.md` + `MOTION.md` written once, read before every other skill. We don't ship a brand file (out of scope), but the pattern is worth noting. |
| bestagentkits/motion-video-skill — github.com/bestagentkits/motion-video-skill | MIT | 130 ★, 2026-09-28 | A fixed, measurable pipeline: 1920×1080 30fps, EBU R128 ~−14 LUFS, true peak ≤ −1 dBFS, music 4-6 dB under speech, ±2 ms beat-grid tolerance | `SKILL.md` (the 8-step pipeline + the numeric exit criteria) | **Y** — MIT | Its loudness numbers are the source of `references/09` §2. |
| frankxai/awesome-motion-design-agent-skills — github.com/frankxai/awesome-motion-design-agent-skills | **CC0 1.0** | 86 ★, 2026-10-24 | The "doctrine" lines we reuse verbatim: "static hierarchy first", "design the reduced-motion path — don't just disable it", "verify on real devices" | `skills/*/SKILL.md` (5 skills: motion-director, remotion-video-agent, web-motion-auditor, site-motion-excellence-director, generative-media-director) | **Y** — CC0 (public domain dedication, more permissive than MIT; no header required but we credit it in ATTRIBUTION.md anyway) | CC0, not MIT — verified from the repo's own LICENSE file (full CC0 text confirmed at the repo root). |
| zhuyansen/awesome-claude-video-skills — github.com/zhuyansen/awesome-claude-video-skills | NOASSERTION (check the file) | 1.2k ★, 2026-10-28 | The index: 373 repos, each security-graded; live page at agentskillshub.top | the repo's `README.md` + its filter page | **N** — it's a *list*, not code; use it to find candidates, don't copy from it | The `agentskillshub.top` site you mentioned IS this repo's live page (verified). |
| Yusuke710/manim-skill — github.com/Yusuke710/manim-skill | MIT | 184 ★, 2026-10-07 | The "narration → TTS → code → render → mux → view" pipeline, local (free) TTS instead of a paid API; the browser video-viewer with a "Capture" note-taking loop | `SKILL.md` + `scripts/` | **Y** — MIT | The *free* TTS fallback (local Kokoro) is the pattern `references/09` §3 marks as the skip-paid path. |

## B. Stickman / SVG character libraries

| Repo / URL | Licence | Stars & last update | What it's good for | Specific files to read or copy | Copy allowed? | Notes / caveats |
|---|---|---|---|---|---|---|
| filippocalippo/StykAnimate-App — github.com/filippocalippo/StykAnimate-App | **GPL-3.0** | 1.3k ★, 2026-10-25 | The full model of how a serious stickman app structures rigs: fixed-length joints, IK for arms/legs, stretchy nodes, two timelines (simple frame strip + advanced layers/keys/easing), onion skins, motion paths, export to MP4/WebM/GIF/APNG/PNG/SVG | `src/pivot/` (document model: commands, undo/redo, rigs, validation), `docs/` (feature contracts, ARCHITECTURE.md), `docs/telemetry.md` | **N** — GPL-3.0: we **cannot** copy its code into a MIT repo. Summarize the *ideas* (rig structure, timeline design) in our own words, link the repo, done. | The authoritative "how do real rig apps work" reference; we cite its concepts in `references/03` without taking a line of code. |
| mans-andersson/animated-svg-stickman — github.com/mans-andersson/animated-svg-stickman | MIT | 1 ★, 2023-08-16 | A *drop-in* stickman: one `engine.js` you script-tag in, A/D/arrows to run, SPACE to jump | `stickman/engine.js` | **Y** — MIT, but 1★/3-years-stale; read for the input-driven gait pattern, don't ship it | Precedent that "copy a `stickman/` dir + one script tag" is a viable zero-install delivery. Our `templates/single-scene.html` is the same shape, more capable. |
| madeindjs/stickman — github.com/madeindjs/stickman | None (no licence file found) | 8 ★, created 2024-01-21 | An SVG stickman *editor* (Solid.js + DaisyUI): the generated SVGs animate with plain SVG (SMIL) tags, no CSS/JS needed on the embed side | the editor's SVG export shape | **N** — no licence = all rights reserved; ideas only | The "SMIL-only export, no runtime JS" pattern is one of our documented trade-offs in `references/12` trap (d). |
| twinji/walking-stick-figure — github.com/twinji/walking-stick-figure | MIT | 2 ★, 2019-01-16 | A *procedural* walk (no sprite sheet): the earliest working example of the phase-driven gait our `walkPose` is descended from | the single-canvas JS (the whole repo is the demo) | **Y** — MIT | Reference only for the technique; we've rebuilt it as data-driven `walkPose(phase, gait)` with the ShengyuStudio gait table, not as this repo's imperative code. |
| levnik-b/stickyman — github.com/levnik-b/stickyman | None (UNVERIFIED — repo 404s via the API on both `main` and `master`, raw README fetch failed; treat as **dead link**, drop from copy sources) | — | (was: stick-figure character animation in SVG) | — | **N** — link is broken as of 2026-10-29 | Listed only to record that we checked it; do not cite it in new docs. |
| wazabaki/isometric-spider — github.com/wazabaki/isometric-spider | None (UNVERIFIED licence — README doesn't state one; no licence file confirmed) | — | The cleanest 2-bone-IK + procedural gait in a single ~500-line `index.html`: foot-plant threshold, strict turn-taking between two gait groups, isometric projection | `index.html` (the whole thing) | **N** until a licence is confirmed — read it, cite the technique in our own words | The "feet stay planted until stretched past a threshold" rule is the same idea as the duty-factor in `references/03` §7, expressed differently. |
| RGBboy/fabrik-2d — github.com/RGBboy/fabrik-2d | None (no licence file found) | 8 ★, 2013-09-10 | The reference 2D FABRIK (forward-and-backward reach) IK solver | the single HTML demo | **N** — no licence; the *algorithm* (FABRIK) is a published paper, fine to implement from the paper's description without copying its code | We use closed-form 2-bone IK (ShengyuStudio, in our `rig.js`) instead of FABRIK — for a 2-bone limb the closed form is exact and faster. |
| tmf-code/inverse-kinematics — github.com/tmf-code/inverse-kinematics | UNVERIFIED (npm package; no licence confirmed in this session) | — | A maintained 2D/3D IK npm package (`Solve2D`) | `src/index.ts` | **N** until verified — we ship our own 10-line `ik2` in `library/js/rig.js` instead, to stay zero-dependency | The "zero-dependency" rule is why we don't `npm install` an IK lib. |
| ArcademMan/PyLuxel (docs) — github.com/ArcademMan/PyLuxel | UNVERIFIED licence (Python pyxel-derivative; not confirmed this session) | — | A *documented* FK skeletal stickman in Python: `Pose` (angle snapshot), `Animation` (immutable keyframe list + loop mode), `Pose.lerp` (shortest-path angle interpolation), `walk.sample(t)` | `pyluxel/docs/animation.md` (the API reference) | **N** until verified — we take the *shape* of the API (Pose = angle snapshot, Animation = keyframes + loop mode, sample(t)) which our `rig.js`/`timeline.js` already implement independently | The closest published "stickman rig as a library API" to ours; useful to confirm we didn't miss a concept. |
| ShengyuStudio two-bone-IK devlog — shengyugames.com/devlog/two-bone-ik-stick-figure-animation (updated 2026-10-16, not a GitHub repo — a blog post) | n/a (prose, read-and-understand, no code licence to inherit) | — | The gait table our `walkPose` numbers come from: walk cadence 1.5 c/s / stride 44 / step-height 15 / duty 0.62; run 2.55 / 60 / 26 / 0.40; and the **moonwalk fix** `scroll = stride × cadence ÷ duty` | the whole article (10 min read) | **Read freely, cite as a technique reference** (it's an explanation, not a code drop) | The one non-GitHub source in this whole index; marked as such. |

## C. Code-driven animation engines

| Repo / URL | Licence | Stars & last update | What it's good for | Specific files to read or copy | Copy allowed? | Notes / caveats |
|---|---|---|---|---|---|---|
| motion-canvas/motion-canvas — github.com/motion-canvas/motion-canvas | MIT | 19.5k ★, 2026-07-02 | The reference for "generator-driven" code animation: `scene()`/`generator` functions, tweening, `Easing` presets, reusable scene components, the render-to-mp4 pipeline | `packages/2d/` (the 2D tween API), `packages/core/` (the generator/scene model) | **Y** — MIT | We don't use Motion Canvas (heavy install); we list it as the "when you outgrow vanilla JS" upgrade in `references/10` §5, next to Remotion. |
| motion-canvas/examples — github.com/motion-canvas/examples | MIT | 1.2k ★, 2024-03-21 | Concrete `scene()` + `generator` examples: smooth-parallax, deferred-lighting, an anniversary piece | `examples/smooth-parallax/src/scenes/` (layered parallax done in code) | **Y** — MIT | Read for the *shape* of a multi-scene code animation; our `templates/multi-scene.html` is the vanilla-JS version of the same idea. |
| remotion-dev/remotion — github.com/remotion-dev/remotion | Source-available (not plain MIT — "Remotion License"; free up to ~10k monthly commercial views, UNVERIFIED exact number this session, check remotion.dev/docs/license) | 68.7k ★, 2026-10-28 | The React-video framework; **deterministic by construction**: each frame is a pure function of `useCurrentFrame()`, so a still/render/preview are always the same pixel | `docs/render-as-gif` (GIF codec + `everyNthFrame`), `docs/gsap` (the `@remotion/gsap` bridge, `useGsapTimeline()`), `packages/gsap/` | **Y (the code patterns) / N (don't paste Remotion source into a non-Remotion project)** | The `@remotion/gsap` package is verified real: npm `@remotion/gsap@4.0.539`, published 2026-10-26, MIT-licensed, "a paused GSAP timeline, seeked to `frame/fps`" — that's the exact mechanism for making GSAP deterministic (our `templates/gsap-timeline.html` + Remotion path use this). |
| GreenSock/GSAP — github.com/GreenSock/GSAP | Custom "GreenSock License" (UNVERIFIED exact free-use terms this session — check the repo's LICENSE + gsap.com's license page; the practical answer per GSAP's docs is that it's free for personal *and* commercial web use, no attribution required, UNVERIFIED against the current page) | 30k ★, 2026-04-13 | The de-facto JS timeline library; `gsap.timeline({paused:true})` + `tl.seek(t)` is the wall-clock-free pattern our GSAP template uses | the version-dated ES module (`src/gsap-X.Y.Z.js`) + `gsap.com/docs/Easing/`, `gsap.com/docs/Tween/seeking/` | **Read the docs; the library itself is loaded from a CDN in our template, not copied** | If the GreenSock licence has changed since we last checked, this row's "free for commercial web use" claim is UNVERIFIED — confirm before shipping a commercial product on it. |
| mrdoob/three.js — github.com/mrdoob/three.js | MIT | 117k ★, 2026-10-29 | The 3D engine we use only in orthographic 2D mode for the optional path; `OrthographicCamera` + `LineSegments`/`BufferGeometry` gives the same rig drawn in WebGL | `examples/webgl/webgl_camera_ortho.html` (the orthographic 2D starter), `src/cameras/OrthographicCamera.js` | **Y** — MIT | `library/threejs/` in our repo is built from this example; the character still comes from our `rig.js` `solve()` — Three.js is just the renderer. |
| ffmpeg/FFmpeg — github.com/FFmpeg/FFmpeg | LGPL-2.1 (with proprietary/non-free elements in parts of the build) | 66k ★, active | The frame-stitching tool; the exact flags our `scripts/stitch.sh` uses (verified against ffmpeg 8.1.2 locally) | `docs/` (the CLI reference) | **Y (run it, don't link its code)** | LGPL means *you* can call the binary freely; it does not infect your MIT skill repo. |
| Puppeteer — github.com/puppeteer/puppeteer | Apache-2.0 | 95.8k ★, 2026-10-28 | Headless-Chrome screenshot capture | `page.screenshot({type:'png', path})`, `page.evaluate(fn, arg)` | **Y** — Apache-2.0 | We chose **Playwright** instead (below) — see why in `scripts/capture_frames.mjs`'s header comment. Both are fine; Playwright's `deviceScaleFactor` API is a one-liner for crisp 2× line capture. |
| Playwright — github.com/microsoft/playwright | Apache-2.0 | 98.8k ★, 2026-10-29 | The capture engine our `scripts/capture_frames.mjs` actually uses; `chromium_headless_shell` is what `npx playwright install chromium` downloads (~118 MB, one-time) | `chromium.launch()`, `page.screenshot()`, `page.evaluate()` | **Y** — Apache-2.0 | The headless-shell binary is vendored into the user's `~/.cache/ms-playwright/` on install, not into this repo. |
| bencevans/screenshot-desktop — github.com/bencevans/screenshot-desktop | MIT | 2.5k ★, 2026-06 | Capturing the *full desktop* to MP4/GIF via cross-platform desktop screenshot — the "record the screen" alternative to per-frame screenshots | `index.js` | **Y** — MIT | Listed as an *alternative* capture path (continuous video/desktop capture, not deterministic per-frame); our default stays per-frame for the contact-sheet workflow. |
| airbnb/lottie (lottie-web) — github.com/airbnb/lottie-web | MIT | 32k ★, active | The runtime for After-Effects-authored vector animation; `lottie.loadAnimation()` + the SVG renderer is the "I don't want to code the animation, I want to play a `.json`" path | `src/` (the player), the `loadAnimation` API | **Y** — MIT | Lottie is the "designer-authored" counterpart to everything in this repo; cite it in `references/10` §5 as the non-code path. |
| Rive (rive-app/rive-wasm) — github.com/rive-app/rive-wasm + rive.app/docs/runtimes | MIT (all official Rive runtimes, per rive.app) | n/a (docs) | A real-time, state-machine-driven 2D animation runtime (canvas/webgl2 wasm); `rive-app/canvas`, `rive-app/webgl2` on npm | the runtime docs "Getting Started with the Rive Runtimes" | **Y** — MIT | The "interactive, not rendered-video" engine; for a stickman *clip* we don't need it, but it's the right tool if the user asks for a playable character, not a rendered one. |

## D. Motion-design theory

| Repo / URL | Licence | What it's good for | Copy allowed? | Notes |
|---|---|---|---|---|
| LottieFiles/motion-design-skill `director/` (re-listed here for the theory rows) | MIT | The 12 Disney principles (with numbers), emotion→motion map, choreography (stagger, counter-motion), narrative structure | Y | The single best "theory numbers" source we found; `references/01` and `references/02` are transcriptions of it, stickman-adapted. |
| iart-ai/motion-design-skills — github.com/iart-ai/motion-design-skills | MIT | A 9-skill *set* on top of the same doctrine: animation-principles, color-motion, shot-composition, motion-art-direction, after-effects, beat-sync-editing, remotion-video, logo-animation, motion-background | Y | The `shot-composition` and `animation-principles` skills are the closest third-party match to our `references/06` + `references/01`. |
| frankxai/awesome-motion-design-agent-skills (doctrine lines) | CC0 | "Static hierarchy first", "design the reduced-motion path", "verify on real devices" — the 3-line doctrine | Y | Quoted verbatim into `skill_instructions.md`. |

## E. Kinetic typography

| Repo / URL | Licence | What it's good for | Copy allowed? | Notes |
|---|---|---|---|---|
| iart-ai/kinetic-typography-skills `skills/kinetic-typography/` | MIT | Stagger/split-text/variable-font recipes, the `?t=N` freeze-harness verify loop | Y | `references/08` §4 is a transcription of its SKILL.md's timing table. |

## F. Rendering / export tooling

| Repo / URL | Licence | What it's good for | Copy allowed? | Notes |
|---|---|---|---|---|
| Remotion docs `render-as-gif` + `@remotion/gsap` | see Remotion row | Deterministic stills/frames + native GIF codec + GSAP bridge | Y (docs/patterns) | `references/10` §5. |
| Playwright (Apache-2.0) + ffmpeg (LGPL, run-don't-link) | see rows above | The whole HTML→frames→MP4/GIF chain | Y | `scripts/capture_frames.mjs` + `scripts/stitch.sh` are built on exactly these two. |
| motion-canvas/exporters — github.com/motion-canvas/exporters | MIT | The official Motion-Canvas render exporters (mp4/gif) | Y | Only if you take the Motion Canvas path. |

## G. Datasets / inspiration (poses, walk cycles)

| Source | Licence | What it's good for | Notes |
|---|---|---|---|
| ShengyuStudio gait table (see §B) | prose, read-and-understand | The *numbers* for walk/run: cadence, stride, step-height, duty, hip-bob | The source of every gait number in `references/03` §6-7 and `library/js/rig.js` `walkPose`. |
| stix `library/poses.md` (16 poses) + `library/transitions.md` (11 CSS patterns) | MIT | A second, SVG-coordinate (not angle-based) source of named poses to cross-check against our angle table | We transcribed its 16 pose names into `references/04`'s catalogue; the *coordinates* stay in stix's file (MIT, cited in ATTRIBUTION.md). |
| The 7-beat "What If" structure | MIT (what-if's `references/formula.md`) | The narrative skeleton for a 15-25s clip | `references/07` §1. |
| The 11-point storyboard self-check + motion check | MIT (what-if's `references/look.md`) | The *visual* QA bar for a board of stills, before any animation is drawn | Folded into `references/11` (section C) and the step-5 done-check in `SKILL.md`. |

---

## UNVERIFIED / to confirm before shipping (the honest list)

- **GSAP's exact current licence text** — the GreenSock License; "free for
  personal and commercial web use" is the long-standing position but the
  current LICENSE file wasn't re-read line-by-line this session. Confirm
  before a commercial product ships on the GSAP template.
- **Remotion's "10k monthly views" free-tier number** — quoted from
  memory of the docs page, not re-verified against the current
  `remotion.dev/docs/license` this session. Confirm the exact number.
- **tmf-code/inverse-kinematics and ArcademMan/PyLuxel licences** — the
  repos exist and were read, but no licence file was confirmed this
  session; treated as "ideas only, no copy" until checked.
- **madeindjs/stickman and wazabaki/isometric-spider** — no licence
  file confirmed this session; treated as all-rights-reserved, ideas
  only.
- **levnik-b/stickyman** — link is dead (404 on API + raw). Dropped from
  all copy sources; kept here only to record that it was checked.
- **agentskillshub.top** — confirmed live and confirmed to be the live
  page for `zhuyansen/awesome-claude-video-skills` (its `README` points
  at it). Not a source of animation knowledge itself; a *directory*.
  Use it to find new candidates, never as a citation.

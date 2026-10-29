# Example 04 — Stickman Trips Over Rock (Cold Start)

## Overview
- **Prompt:** "make a stickman who trips over a rock and gets back up"
- **Duration:** 4.0s (120 frames @ 30fps)
- **Aspect Ratio:** 1:1 square (960x960 canvas captured at DPR 2, producing 1920x1920 source PNGs)
- **Exports:**
  - `animation.mp4`: 1080x1080, H.264 CRF 18, yuv420p, `+faststart`, 117 KB
  - `animation.gif`: 720x720, 12 fps, two-pass palette (`palettegen` + `paletteuse`), 265 KB
  - `contact.jpg`: 8x8 contact sheet (1956x2084 px) sampling all 120 frames

---

## Action & Narrative Breakdown (120 Frames @ 30fps)

1. **Approach / Walk (Frames 0–36 / 0.0s–1.2s):**
   - The hero stickman walks left-to-right (`x: 240 → 455`, `facing: 1`) with `walkPose(phase, gait=0)`.
   - Cheerful expression (`face: 'happy'`).
   - Constant ground contact with planted stance feet (no skating / moonwalk).
   - Rock prop sits statically at `x = 490, y = 720` with a contact shadow.

2. **Trip & Stumble (Frames 36–45 / 1.2s–1.5s):**
   - Leading foot strikes the rock at frame 36.
   - Foot trip triggers a localized dust puff (`fx.dust`) at `[480, 720]`.
   - Deceleration with `power2Out` as momentum is disrupted (`x: 455 → 485`).
   - Arms whip up into surprise; face swaps instantaneously to `'surprised'` at frame 38.

3. **The Fall / Gravity Acceleration (Frames 45–58 / 1.5s–1.93s):**
   - **Hard Rule Gate #12 & Trap B7:** The torso rotation into the ground is eased strictly with `power2In` (accelerating gravity, never ease-out).
   - Torso rotates from 25° forward to 90° horizontal.
   - Arms reach out forward to brace for impact; hips drop toward the ground (`charHipY` lowers).

4. **Impact & Sprawl Hold (Frames 58–72 / 1.93s–2.4s):**
   - **Impact on Frame 58:**
     - 1-frame impact flash (`fx.flash`).
     - Dual dust puffs at hands and torso (`fx.dust` at `x=520` and `x=590`).
     - Screen shake (4px amplitude on frame 58 decaying to 0 by frame 63 via `cam.shakeAt`).
     - Face swaps to `'oops'` precisely on the impact frame (Gate #4 & references/05).
   - **Realization Hold (Frames 58–72):**
     - Stickman sprawls horizontally along the ground line with arms extended.
     - Contact shadow dynamically elongates to 150px wide to ground the prone body.
     - Face swaps from `'oops'` to `'worried'` at frame 66 during the 14-frame comedic pause.

5. **Recovery Phase 1 — Push-up (Frames 73–82 / 2.43s–2.73s):**
   - Hands press against ground, chest lifts, torso angles upward to 40° with `power2Out` (deliberate recovery).
   - Face: `'worried'`.

6. **Recovery Phase 2 — Knee Tuck / Crouch (Frames 82–92 / 2.73s–3.07s):**
   - Hips lift, knees draw under the torso into a crouched position (`legL: [35, 80]`).
   - Face: `'determined'`.

7. **Recovery Phase 3 — Stand Up (Frames 92–100 / 3.07s–3.33s):**
   - Legs straighten, torso comes upright to neutral stand with `power2Out`.
   - Face: `'neutral'`.

8. **Settle Squash & Dust-off (Frames 100–108 / 3.33s–3.6s):**
   - Settle spring with a knee squash (`bob: -4`) and dust-off arm gesture (`face: 'happy'`).
   - Settles back to upright neutral with `power2Out` (Gate #13 & Trap B8 — no dead stop without settle).

9. **Neutral Standing Hold (Frames 108–119 / 3.6s–4.0s):**
   - Stable held neutral pose (`POSES.neutral`, `face: 'neutral'`) through frame 119.

---

## Verification Results

| Check / Gate | Result | Details |
|---|---|---|
| **Story Schema & Position Contracts** | **PASS** | `node scripts/validate_story.mjs examples/04-cold-start-trip/story.json` passed with 0 errors and 0 warnings. |
| **Determinism Contract (Gate #1)** | **PASS** | `node scripts/capture_frames.mjs` performed double capture of frame 0; byte-identical match confirmed (no `Math.random` or wall-clock leaks). |
| **Total Frames & Duration (Gate #24)** | **PASS** | Exactly 120 frames captured (0 to 119) at 30 fps = 4.000s duration. |
| **One Rig Function (Gate #1)** | **PASS** | All figure rendering driven purely through `solve()` / `drawFigure()` from `rig.js`. No manual stick geometry. |
| **Line Weight & Ink (Gates #2, #3)** | **PASS** | Fixed strokeWidth (7px on height 320) and ink color `#1c1c1c`. |
| **Contact Shadows (Gate #20)** | **PASS** | Contact shadows rendered under both rock and character; character shadow dynamically scales with posture. |
| **Gravity Acceleration (Gate #12)** | **PASS** | Fall uses `power2In` from frame 45 to 58. |
| **Discrete Face Swaps (Gate #30)** | **PASS** | Expressions swap discretely at keyframes (`happy` → `surprised` at f38 → `oops` at f58 → `worried` at f66 → `determined` at f82 → `neutral` at f92). |
| **Video & GIF Export (Gates #33–36)** | **PASS** | MP4 is 1080x1080 @ 30fps (yuv420p, `+faststart`, 117 KB). GIF is 720x720 @ 12fps (two-pass palette, 265 KB). |
| **Contact Sheet (Gate #16)** | **PASS** | 8x8 contact sheet rendered at `contact.jpg` verifying readable silhouettes across all phases. |

---

## Friction Points & Documentation Feedback

1. **Hip Offset Translation in Ground / Prone Poses (`references/03` & `04`):**
   - In `rig.js`, the standard `defaultHipY = groundY - (DEFAULTS.thigh + DEFAULTS.shin) * (height / DEFAULTS.height)` assumes upright feet planted at local `y ≈ 0`.
   - When a character lies flat on the ground (`torso: 90`), the torso and head extend horizontally at local `y ≈ 140`. If the caller maintains `defaultHipY`, the figure draws floating ~140px above the ground line.
   - To make the prone figure contact the ground, the caller must translate `charHipY` down to `groundY + 115`.
   - *Doc suggestion:* Add an explicit section or code snippet in `references/03` §2 or `references/04` §2 under `trip / fall` and `POSES.down` illustrating the translation adjustment needed for prone/grounded poses.

2. **CLI Relative Path Documentation:**
   - The CLI commands in `SKILL.md` (e.g. `node scripts/validate_story.mjs story.json`) assume either running inside the example directory or passing paths from the repository root.
   - Explicitly noting `node scripts/validate_story.mjs <path/to/story.json>` works from the repository root is helpful for automated subagents.

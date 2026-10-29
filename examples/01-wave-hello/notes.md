# Example 01 — Wave Hello

## Overview
- **Prompt:** A stickman waves hello to the camera with a happy face, then returns to a relaxed neutral pose.
- **Duration:** 2.0s (60 frames @ 30fps).
- **Resolution:** 960x960 canvas captured at DPR 2 (1920x1920 source PNGs).
- **Export:** 1080x1080 MP4 (H.264 CRF 18, 23KB) + 720x720 GIF (two-pass palette, 65KB).

## Techniques Used
- **Single character rig:** `library/js/rig.js` with `POSES.neutral` and `POSES.wave`.
- **Easing:** `power2InOut` for arm lift, `power2Out` for settling.
- **Face swaps:** instantaneous facial expression swap from `neutral` to `happy` at frame 10, back to `neutral` at frame 45 (no morphing, following `references/05`).
- **Determinism:** `window.__seek(frame)` + `window.__ready()`, verified byte-identical double capture of frame 0.

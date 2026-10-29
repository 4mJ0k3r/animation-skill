# Example 02 — The Chase

## Overview
- **Prompt:** A stickman is chased across two continuous scenes by a faster blue stickman with dust effects and a match-cut transition.
- **Duration:** 6.0s (180 frames @ 30fps).
- **Structure:** 2 scenes of 3.0s (90 frames) each.
- **Resolution:** 960x960 canvas captured at DPR 2 (1920x1920 PNGs).
- **Export:** 1080x1080 MP4 (H.264 CRF 18, 406KB) + 720x720 GIF (two-pass palette, 787KB).

## Techniques Used
- **Multi-character hierarchy:** Hero (black `#1c1c1c`, height 320, 7px stroke) and secondary chaser (blue `#0984e3`, height 224 ≈ 0.7x scale, 5px stroke). Follows `references/03` §9 for character distinction.
- **Procedural run locomotion:** Both characters driven by `walkPose(phase, gait=1.0)` from `rig.js` with different cadences (1.2 vs 1.4 cycles/s) so chaser visibly gains on hero.
- **Match-cut continuity:** Position contract connects Scene 1 and Scene 2 at frame 90. Scene 2 picks up the exact sprint pose and momentum, shifting camera from wide (zoom 1.0) to dynamic medium-close (zoom 1.25, shake 3).
- **FX:** Procedural dust puffs at footfalls (`fx.dust`) and trailing speed lines (`fx.speedLines`).
- **Transition out:** 12-frame dip to black.
- **Determinism:** `window.__seek(frame)` + `window.__ready()` verified byte-identical.

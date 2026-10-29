# Example 03 — What If You Jumped Off The Earth?

## Overview
- **Prompt:** What if you jumped off the Earth? A 16-second stickman science explainer animation calculating human jump vs planetary escape velocity with real physics sourcing.
- **Duration:** 16.0s (480 frames @ 30fps).
- **Structure:** 3 scenes:
  1. *Hook & Normal Jump* (5.0s / 150 frames): Title card text pop, vertical jump to 0.5m, readout of takeoff velocity.
  2. *The Escape Launch* (6.0s / 180 frames): Rocket super jump upward, speedlines, camera pan, escape velocity HUD calculation.
  3. *Space Orbit & Punchline* (5.0s / 150 frames): Earth curve below, floating in zero-G, oops face, text pop "Forgot the spaceship."
- **Resolution:** 960x960 canvas captured at DPR 2 (1920x1920 source PNGs).
- **Export:** 1080x1080 MP4 (H.264 CRF 18) + 720x720 GIF (two-pass palette).

## Science Sourcing
Sourced in `story.json` according to references/11 check 38:
1. **Takeoff velocity:** \(v = \sqrt{2gh} = \sqrt{2 \times 9.81 \times 0.5} \approx 3.1\text{ m/s}\).
   Source: *Journal of Applied Biomechanics*, Linthorne (2001).
2. **Earth Escape Velocity:** \(v_e = \sqrt{2GM/R} = \sqrt{2 \times 6.6743 \times 10^{-11} \times 5.9722 \times 10^{24} / 6.371 \times 10^6} \approx 11.186\text{ km/s} = 11.2\text{ km/s}\) (Mach 33).
   Source: NASA Planetary Fact Sheet - Earth (`nssdc.gsfc.nasa.gov`).

## Techniques Used
- **Formula & Beat Structure:** 7-beat explainer formula from `references/07` §1.
- **Camera Movement & Shake:** Coordinated camera movements in scene transitions.
- **FX & Particles:** `fx.textPop`, `fx.dust`, `fx.speedLines`, and seeded stars with `fx.hash`.
- **Transitions:** Whip pan into Scene 2, flash to white into space, fade to black at end.
- **Determinism:** `window.__seek(frame)` + `window.__ready()` verified byte-identical.

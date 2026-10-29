# Scene Composition

Camera, framing, layering, and background for code-drawn scenes.
The core question this file answers: *given a story beat, what does the
frame look like, and how do I build it deterministically?*

> Look rules adapted from what-if-animation's `references/look.md`
> (MIT) and the stix style guide (900×400 viewBox, ground at y=355,
> MIT). Numbers below are stated in *our* default 1920×1080 canvas
> unless noted.

---

## 1. Aspect ratios & canvas

| Target | Canvas | When |
|---|---|---|
| Landscape MP4 | 1920×1080 | default explainer / YouTube |
| Vertical (Reels/Shorts/TikTok) | 1080×1920 | social; keep the character in the middle third, titles at top |
| Square (embeds, GIFs) | 720×720 or 900×900 | social feeds |
| Wide panorama | 1920×600 | landscape pans (chase scenes) |

stix's 900×400 viewBox is a *working* canvas, not an export spec —
the export scale is set by `--width` in the capture pipeline. Pick the
export aspect *first* and design the scene in it; don't design at 900×400
and stretch to 16:9 (ground lines distort).

## 2. Safe margins (keep text & key action here)

For a 1920×1080 frame:
- **Action safe**: 90% margins — keep the character inside
  x: 192–1728, y: 108–972.
- **Title/text safe**: 80% margins — keep all words inside
  x: 384–1536, y: 216–864.
- **Bottom 15%** (y > 918): never place text — mobile UI overlay zone
  on vertical video, and it reads as "cut off" on any player.

Rule of thumb: *a word that sits on the frame edge is a failed QA
check.* The contact sheet will show it immediately.

## 3. Ground line & scale anchors

- Draw a **ground line** (the stix guide: dashed, y=355/400 → in
  1080p, ground at y≈950). Characters' feet sit on it. Everything above
  the ground line floats unless it's a prop with its own shadow.
- **Scale anchor = the character.** Default 142px height at 900×400
  (≈1/3 of frame height). At 1080p, scale the whole scene by ×2.7 or set
  `height` on the rig to ≈380px. Props are sized *relative to the
  character*, not absolute: a bench ≈ 1.4× character height, a door ≈
  2× character height.
- **Contact shadows**: every standing object gets a dark ellipse under
  it (opacity 0.15–0.25, 1-2px tall) where it meets the ground. This is
  what makes a flat 2D scene read as "existing". (what-if's trap list:
  "Furniture without legs floated; every standing thing gets a contact
  shadow.")

## 4. Layering & parallax

A scene is layers, back to front:

```
L0  sky / gradient          (static)
L1  far background          (parallax factor 0.2-0.4)
L2  midground: props, sets  (factor 0.7-0.9)
L3  characters              (factor 1.0)
L4  foreground occluders    (factor 1.1-1.3, blurred, dark)
L5  effects: dust, flashes  (factor 1.0)
```

- When the camera pans, each layer moves `cam.x × factor` —
  `library/js/camera.js` `toScreen()` does this per layer.
- **Foreground blur**: one dark, blurred, *out-of-focus* shape in the
  bottom third of 1/3 of your shots reads as depth-of-field instantly.
  Implement: a 60-120px tall rectangle, `ctx.filter = 'blur(16px)'`,
  opacity 0.5, in front of the character. (what-if's `blur16`.)
- Don't give the *background* parallax faster than the foreground, or
  depth inverts and the scene reads as "inside a tube".

## 5. Lighting (the single biggest style lever)

what-if's measured look: **"Light does most of the work."** Rules:

1. **Every light comes from something visible** — a window, a lamp,
   the sun. A pool of light with no source reads as a gradient bug.
2. **Mid-tones dark, pools bright.** Background walls at 40-60%
   brightness; the subject sits *inside or against* a pool at 80-100%.
   An evenly-lit frame is a failed frame.
3. **Rim light** on the character's edge facing the light: draw the
   character once in the body color, then re-draw the same stroke
   offset 2-3px and stroked in the light color at 0.5 alpha, clipped
   to the light side. (Two-pass stroke = rim light.)
4. **Grain + vignette** on every frame (0.04-0.08 grain, 0.15-0.25
   corner vignette) finishes the look. One CSS `radial-gradient`
   overlay + an `feTurbulence` filter (or a pre-rendered 64×64 noise
   tile tiled at 0.05 alpha) does it.

For the *clean explainer* style (white background, no dusk), skip all
of this: flat white background, one soft gray contact shadow, thin
uniform lines. The two styles are both valid — just don't mix them in
one video.

## 6. Camera moves (the 4 you actually use)

| Move | How | When |
|---|---|---|
| **Push-in** | zoom 1.0 → 1.6 over 60-120 frames, `power2InOut` | emphasis, realization beat |
| **Pull-out** | reverse | reveal, "and then it all connects" |
| **Pan/tracking** | cam.x follows the character (factor 1.0) at constant speed | chase, walk-across |
| **Static** | no cam move at all | the default. 70% of shots should be static or near-static |

Rules:
- **No move during an impact frame.** A jump landing on the same frame
  the camera pushes in = the impact is lost in the motion. Hold the
  camera for the impact 10 frames, *then* move.
- **One move per shot.** A pan + a push-in in the same 3-second shot
  reads as a render bug.
- Camera shake: `shake: 2-6px` on the impact frame only, 2-4 frames
  total (`camera.js` `shakeAt` is seeded — deterministic).

## 7. Framing vocabulary (shot list)

what-if's measured: median shot 0.7–3s; no static shot over ~3s; vary
size AND angle every cut.

| Shot | Zoom (1920 wide) | Shows | Use |
|---|---|---|---|
| Establishing wide | 0.75-1.0 | whole set, character small | open of a location |
| Medium | 1.5-2.0 | waist up | dialogue, reactions |
| Close-up | 3.0-4.5 | head | emotional peak |
| Macro insert | 6-10× on an object | the object huge, blurred edges | "the key prop" beat |
| High angle | wide + cam.y above | looking down | vulnerability, smallness |
| Low angle | wide + cam.y below | looking up | power, drama against sky |
| Over-the-shoulder | medium + big dark blurred foreground 1/3 of frame | the other character | 2-character scene |
| Schematic | any + dark grid overlay, mono labels | the "fact" beat | explain-the-number |

**No two adjacent shots share size AND angle** — the what-if rule.
A wide→medium cut is fine; wide→wide is a skipped beat.

## 8. Z-order (draw order) bugs

The #1 composition bug: a leg drawn *over* a torso it should be behind
(figure reads as deformed), or a prop drawn in front of a character it
should occlude. Fix at the *scene* level, not per-frame:

1. Within a character: far limbs → torso → near limbs → head.
2. Scene: background → far props → characters (sorted by y, or by
   depth for the "in a room" sets) → near props → foreground → FX.
3. A character walking *behind* a bench: split its draw — draw the
   figure, then the bench's front legs over it, then re-draw the
   figure's near-side limb. (The "half-behind" effect.)

The QA checklist item "z-order correct" = you can't find any frame in
the contact sheet where a limb crosses the torso the wrong way.

## 9. Backgrounds (the 5 you need)

From `library/svg/backgrounds/` (built in step 4 of the pipeline):
- **void**: flat color / subtle gradient. Default for explainers.
- **room**: perspective floor (vanishing point at 1/3 height), one
  window, 2-4 furniture silhouettes at 0.3 alpha. The workhorse.
- **street**: sidewalk band at bottom, building silhouettes 0.2 alpha,
  a tree on one side.
- **park**: grass band, 2-3 trees, a bench.
- **night**: dark sky + moon + a pool of light from a lamp on one side
  (the "light from a source" rule at its simplest).

Rule: a background is *finished* when it has 20+ designed objects in a
wide shot (what-if's checklist item 6: "no empty wall, no floating
furniture"). An empty gray rectangle is a placeholder, not a background.

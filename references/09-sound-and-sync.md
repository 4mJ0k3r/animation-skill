# Sound & Sync (optional)

**This entire file is optional.** The default pipeline ships a silent
MP4/GIF and is complete without it. Sound is an upgrade layer: a music
bed and a few impact SFX, optionally a voice-over. Paid services
(ElevenLabs, paid SFX libraries) are marked [PAID] and always have a
free fallback or a "skip audio" mode.

> Numbers from what-if-animation's `references/sound.md` (MIT, ElevenLabs
> pipeline) and its master step (loudness targets), generalized to any
> audio source.

---

## 1. The three tiers (pick one, don't mix)

| Tier | Contents | Cost | When |
|---|---|---|---|
| **Silent** | none | free | the default; a stick-figure GIF doesn't need audio |
| **Music + SFX** | one music bed + 3-6 impact hits | free if you use bundled clips or a local CC0 music library | most MP4 exports |
| **Full (voice)** | music + SFX + TTS voice-over | [PAID] ElevenLabs credits (the what-if run cost ~150 credits for a 23s episode) | explainer with narration |

If the user says nothing about audio → ship **Silent** or **Music +
SFX** from bundled files only. Never assume a paid API key exists.

## 2. Loudness targets (the two numbers that matter)

From what-if's `master.py` (two-pass ffmpeg `loudnorm`):

- **Integrated loudness: −14 LUFS** (the streaming standard; EBU R128 is
  −23 for broadcast, −16 for podcast, −14 for music-heavy content like
  an animated explainer).
- **True peak: ≤ −1.0 dBTP** (headroom so the file doesn't clip when
  a platform re-encodes it).
- **Pass threshold**: |measured − target| ≤ 0.5 LU and TP ≤ −1.0.

ffmpeg two-pass (the exact command shape in what-if's master.py):

```bash
# pass 1: measure
ffmpeg -i mix.wav -af loudnorm=I=-14.0:TP=-1.5:LRA=11 -f null /dev/null
#   -> prints measured_LUFS, measured_TP, offset, ...
# pass 2: apply with measured values
ffmpeg -i mix.wav -af "loudnorm=I=-14.0:TP=-1.5:LRA=11:measured_I=..:measured_TP=..:measured_LRA=..:measured_thresh=..:offset=..:linear=true" \
  -c:a aac -b:a 256k -ar 48000 out.wav
```

## 3. Voice-over (the [PAID] tier)

- **ElevenLabs** is what the what-if skill uses (one take per script,
  then pause-cutting to the genre pace). Free tier: limited credits,
  attribute on their site. **Free fallback:**
  - `say` (macOS) / Windows SAPI / `espeak-ng` (Linux) — robotic,
    usable for *storyboard timing* (word timestamps), not for delivery.
  - Kokoro (local TTS, what the Yusuke710 manim-skill uses) — free,
    on-device, passable for explainer VO.
- **Word timestamps** matter more than the voice quality: the pipeline
  needs one JSON of `{word, time_s}` to cut on the word
  (`references/07` §2). Any TTS that can output word-level timestamps
  works; the what-if `voice.py` extracts them from ElevenLabs' response.

## 4. SFX design rules (from what-if's sound.md)

- **One event per visible action.** A character lands = one thump.
  Don't stack thump + dust + whoosh on the same frame — the mix
  muddies.
- **A hit that illustrates a word lands in the pause just after it,
  never on it.** (what-if's `mixcheck.py` lists every moment where an
  effect comes within 3dB of the voice while a word is spoken — those
  are the collisions to fix.)
- **Beds stay low under key lines**: 0.1-0.15 gain under a spoken
  fact; a rising hum that covers the turn-phrase is a flagged mix
  error.
- **Music −4 to −6 dB under speech** (the motion-video-skill standard).
- **Leveling is per stem**: lower one SFX and every other SFX on that
  stem rises. Level the stem, not the event.

## 5. Bundled / free audio assets

- `studio/library/sfx/` in the what-if repo ships ~40 starter clips
  (MIT) — a thump, a whoosh, a pop, a ding. For our repo: keep a
  `library/audio/sfx/` folder and drop 5-10 CC0 clips there (or leave
  it empty and have the agent note "no SFX available, running silent").
- Music: ccMixter / inSND / YouTube Audio Library (each with their own
  licenses — *check the clip's license, not the site's*; record it in
  `story.json`'s `audio.sources[]` if you use one).

## 6. Muxing (video + audio → final MP4)

```bash
ffmpeg -i animation.mp4 -i mix.wav -c:v copy -c:a aac -b:a 256k \
  -movflags +faststart -shortest final.mp4
```

`-c:v copy` = don't re-encode the video (the frames you already
verified are byte-identical in the output). `-shortest` = stop at the
shorter stream (audio longer than video = a silent tail).

## 7. The "skip audio" contract

`story.json` has an `audio` object; **its absence is the skip signal.**
The pipeline steps 7-8 check `if (!story.audio) { skip to export
silently }`. An agent that can't find any audio assets and no API key
must not block the pipeline — it must ship the silent file and say so
in the report (step 10).

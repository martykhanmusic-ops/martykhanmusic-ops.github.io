# KHAN.u $TAY: editing style

Moody, nocturnal, music-first. Late-night rooms lit by one warm glow, grainy footage
in a black frame, bold type that slams in on the beat. Inspired by the references, copying none of them.

## 1. Hook (first 3 s)
- **0.0 s:** open on the strongest *moving* shot, never a title card. It must already be on the beat.
- **3 shots in 3 s,** cut on the beat (about 1 s each).
- **By 1.0 s:** the first text appears. It's 1–3 words, the "why watch": a lyric, a question, or "this beat took 20 min".
- **Logo:** none in the hook. The logo only shows if the hook *is* a release announcement.
- **Music:** it plays from frame 1. No fade-in and no silent start.

## 2. Pacing and cut rhythm
- **Music sections:** cut every **2 beats** (about 1.2 s at 100 BPM) and always on a beat. Detect the beats with `npx hyperframes beats`.
- **Rhythm:** every 4th or 8th bar, break the pattern with one fast double-cut (1 beat each), then a 4-beat hold.
- **Talking sections:** hold the shot 3–5 s and keep the energy up with a graphic change every phrase instead of cutting.
- **Pauses:** cut every pause over 0.3 s and every false start. No dead air.
- **Length:** 15–30 s for promo reels; under 60 s for talking ones.

## 3. Subtitles
| | |
|---|---|
| Font | **Inter Bold** (Google Fonts, free) |
| Size | 64 px on a 1080x1920 frame |
| Words per card | 1–3, shown word by word on Whisper timestamps |
| Color | Bone `#F3E9DA` |
| Highlight | the key word in each line in Ember `#FB7F05` (or the active palette's accent) |
| Outline / shadow | 3 px `#000000` outline + 40% soft shadow, 4 px down |
| Position | centered, middle of the text at **62% of frame height**, clear of the lower-third graphics and the app UI |
| Case | sentence case; ALL CAPS only for a single punch word |
| In / out | 120 ms ease-out pop-in from scale 0.95; no exit animation (the next word replaces it) |

**Titles and big type:** **Anton**, skewed −12° to echo the distressed wordmark, in Bone on black, 140–220 px.

## 4. Color grade
- **Blacks:** crushed deep and slightly blue (lift ≈ 0, shadows tinted toward `#05051C`).
- **Highlights:** warm, pulled toward amber/orange. It's a single-glow look: cool room, one warm light.
- **Saturation:** −10% overall. Keep the orange and purple accents strong.
- **Skin:** natural; never push it blue.
- **Daylight footage:** grade it toward dusk (lower exposure, cooler shadows).

## 5. Framing and grain
- **B-roll / music shots:** 4:3 window (1080x810), centered in a **black vertical frame**. Every few cuts, let the window drift ±2–4% in scale and position, like a handheld camcorder collage.
- **Talking to camera:** full-frame 9:16, with graphics as cards in the lower 40%.
- **Grain on everything:** `noise=alls=8:allf=t+u`, plus a light vignette (`vignette=PI/5`).
- **Logos and text:** grain sits under them only, so they stay crisp.

## 6. Palettes
Use one palette per video.

**Midnight Ember** (blue room, orange glow). Default.
`#05051C` ink · `#052454` deep navy · `#064985` cobalt · `#127BBC` sky · `#FB7F05` ember · `#F35506` burn

**Violet Storm** (purple neon night, city lightning). For late-night and emotional tracks.
`#07060A` void · `#191522` night · `#322C3F` plum shadow · `#785990` violet · `#B992A9` haze · `#F3B20C` lamp gold

**Ink & Bone** (cream/black print, vintage textures, pop-art shadow). For announcements, lyrics and drops.
`#000000` black · `#161617` ink · `#F3E9DA` bone · `#C5AD94` sepia · `#EBB4CB` print pink · `#E9CA4A` sketch yellow

## 7. Motion rules (titles and graphics)
From `references/mood/animation-rules.jpg`:
1. **Entrances:** ease-out, 150–250 ms. Start from scale 0.95–0.97, never from 0.
2. **Exits:** 20% shorter than the entrance. Exit back toward where the element came from.
3. **Lists, swatches and lyric lines:** stagger 30 ms per item.
4. **Moves:** ease-in-out, along arcs rather than straight lines.
5. **No bounce,** except one rubber-band overshoot on the big title slam.
6. **Transitions:** overlap the old and new states (crossfade + blur), never a hard pop-off.
7. **Reveals:** use masks for reveals and color changes. A wipe, matched to the beat, reveals the logo.
8. **Confirmation:** one pulse (scale 1.0 → 1.04 → 1.0) to confirm a key moment, like a release date or a "link in bio".

## 8. Music and audio
- **Mix:** master at about −14 LUFS integrated, with true peak ≤ −1 dB.
- **With voice:** music ducks to about −18 dB under the voice (sidechain); voice stays at about −16 LUFS.
- **Music-only reels:** music at full level, with every cut on a beat.
- **Endings:** the music ends on a downbeat or a hard stop, never a long fade.
- **Track:** default to my own tracks. Ask me which one if none is given.

## 9. Logo usage
The files are in `references/brand/`. They have black backgrounds, so composite them with **screen** blend.

| File | Use |
|---|---|
| `wordmark-distressed.png` | **Hero.** Intros, end card, release announcements. Slam in skewed, with a mask wipe and one overshoot. |
| `logo-serif-stacked.png` | **Clean title card.** Track names, credits, calm or late-night videos. Fades in over 250 ms. |
| `logo-pink-drip.png` | **Accent only.** Max once per video, for a playful drop or hype moment. Pairs with the Ink & Bone palette. |

- One logo appearance per video, plus the end card.
- Never stretch, recolor or add effects to the logo beyond the grain underneath it.

## 10. End card (last 2 s)
- **Background:** black (`#000000`), with grain.
- **Logo:** the distressed wordmark, centered, mask-wiped in on the final downbeat.
- **Under it:** a 1-line CTA in Inter Bold 48 px Bone, e.g. *"new music friday"* or *"stream it now"*, ending with a single Ember underline pulse.
- Hold 1.5 s, then hard cut out with the music.

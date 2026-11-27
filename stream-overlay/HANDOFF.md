# Handoff Spec: KHAN.u$TAY stream overlay

## Overview

Branded overlay for live music streams: one **main live** layer (transparent centre, sits on
top of camera/capture) and three full-screen **cards** (starting soon, be right back, stream
ending). Each exists in **16:9 (1920x1080)** for Twitch/YouTube and **9:16 (1080x1920)** for
TikTok/IG Live. Delivered as 10 s seamless loops, 30 fps, VP9 WebM with alpha
(`alpha_mode=1`). Source of truth for every value below: `scenes.py` / `render.py`
(scratch build scripts; values copied here so the overlay can be rebuilt as live HTML).

Visual language comes from the 13 reference GIFs: CRT scanlines, RGB-split glitch, neon on
black, terminal/HUD system text ("ESTABLISHING CONNECTION", "SIGNAL LOST", "NEXT STEP",
"TARGET COORD", "MISS ME? YES / NO", "THANK YOU FOR LISTENING"), and the two KHAN.u$TAY
wordmarks (pink flame = primary, yellow script = secondary).

## Design tokens

| Token | Value | Usage |
|---|---|---|
| `color-pink` | `#FF2E88` | Primary brand; "STARTING SOON"; LIVE badge fill; border cycle stop 1 |
| `color-cyan` | `#2EF2FF` | HUD brackets; "BE RIGHT BACK"; progress bar; border cycle stop 2; glitch split |
| `color-yellow` | `#FFD400` | Ticker text; border cycle stop 3; glitch split |
| `color-terminal` | `#5AFF96` | Sub-lines and blinking cursor (terminal voice) |
| `color-teal` | `#50F0DC` | "THANK YOU FOR LISTENING" |
| `color-void` | `#06060C` | Card background |
| `color-ticker-bar` | `#05050C` @ 72% | Ticker backing bar |
| `font-display` | Liberation Sans Bold, horizontally scaled to 82% | Card titles (Arial Narrow metrics) |
| `font-terminal` | DejaVu Sans Mono Bold | Ticker, sub-lines, CAM label, ending title |
| `logo-primary` | `assets/logo_pink.png` (keyed from IMG_6739) | Every screen, top centre/left |
| `space-edge` | 56 px | Outer margin for badge, cam, ticker |
| `space-border` | 22 px | Neon border inset |
| `space-bracket` | 48 px | HUD bracket inset |
| `radius-badge` / `radius-cam` | 10 / 18 px | LIVE badge / camera window |
| `glow-border` / `glow-cam` / `glow-title` | blur 12 / 9 / 18 px | Gaussian glow under strokes and titles |
| `scan-main` / `scan-card` | 1 px dark line every 4 px at 10% / 35% | CRT scanlines |

## Layout

### Main live, 16:9 (1920x1080)
| Element | Position / size | Spec |
|---|---|---|
| Neon border | rect inset 22, stroke 4 | `color` cycles pink -> cyan -> yellow, glow 12 |
| HUD brackets | 4 corners, inset 48, arm 80, stroke 6 | cyan + glow |
| Logo | x 62, y 48, height 150 | glitch bursts (see Motion) |
| LIVE badge | x 1714-1864, y 52-100, radius 10 | pink fill 92%; white dot 16 px at +16,+16; "LIVE" 30 px Liberation Bold, white |
| Camera window | x 56-600, y 642-948 (544x306, 16:9), radius 18, stroke 4 | stroke = border colour; label "CAM 01" 22 px mono at +18,+14 |
| Ticker | x 56-1864, y 964-1020 (h 56) | bar `color-ticker-bar`; text 30 px mono yellow, left-aligned, scrolling |
| Content area | everything else | fully transparent |

### Main live, 9:16 (1080x1920)
| Element | Position / size | Spec |
|---|---|---|
| Border + brackets | as 16:9 | |
| Logo | centred, y 232, height 160 | below the app's top bar (TikTok/IG safe zone) |
| Ticker | x 56-1024, y 420-476 | text 34 px mono |
| LIVE badge, camera window | **not drawn** | the app shows its own LIVE badge; the phone camera is full frame |

### Cards (both shapes)
| Element | 16:9 | 9:16 |
|---|---|---|
| Logo (height / top) | 200 / 18% of H (ending: 8%) | 230 / 20% (ending: 12%) |
| Title | 190 px `font-display`, one line, centred at 52% H | 170 px, split onto 2 lines |
| Ending title | 150 px `font-terminal`, 2 lines, centred at 55% H | 120 px |
| Sub-line | 34 px mono, centred at 72% H (ending 80%) | 36 px, 68% H |
| Cursor | 20x36 block after the sub-line | same |
| Progress bar (starting soon) | 42% W, 26 h, 70 px below sub-line, cyan outline 3 | 70% W |

## Components

| Component | Variant | Props | Notes |
|---|---|---|---|
| NeonFrame | main | `color` (animated) | border + glow + HUD brackets |
| Wordmark | pink flame | `height`, `glitch` | only the two KHAN.u$TAY marks; never Marty Khan marks |
| LiveBadge | 16:9 only | `pulse` | dot pulses, text static |
| CamWindow | 16:9 only | `label` ("CAM 01") | exact 16:9 so a webcam source fits with no crop |
| Ticker | both | `items[]`, `separator` (" • ") | loops seamlessly; see content limits |
| CardTitle | soon / brb / end | `text`, `color`, `font` | ending uses the terminal font to echo the video's end card |
| TerminalLine | all cards | `text`, `cursor` | always `color-terminal`, always uppercase |
| ProgressBar | soon only | `progress` 0-1 | fills over the loop; restarts each loop |

## Motion

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Neon border, cam stroke | loop | colour cycle pink -> cyan -> yellow -> pink | 10 s per full cycle | cosine (ease-in-out) per segment |
| Logo / card title | frames 58-62, 64-66, 168-171, 247-250 | RGB split: cyan copy offset +x, yellow copy offset -x/2 | 4 / 2 / 3 / 3 frames | step (instant on/off) |
| | | offsets 12, -8, 16, 10 px | | |
| LIVE dot | loop | opacity 0.1 -> 1 | 1 s period | cosine |
| Ticker | loop | scroll left by 2 full text widths | 10 s | linear |
| Cursor | loop | blink | 0.5 s on / 0.5 s off | step |
| Progress bar | loop | 0 -> 100% | 10 s | linear |
| Card noise | every frame | 6 px-block noise at 5% | continuous | - |
| CRT roll band | loop | soft bright band (7%) rolls top -> bottom | 10 s | linear |
| BRB static burst | frames 0-6 of every 100 | full-frame static at 45% | 7 frames every 3.3 s | step |
| Ending title | loop | brightness flicker 0.76-1.0 | 7 cycles per 10 s | cosine |

Every animation completes a whole number of cycles in 300 frames, so the loop point is
invisible (measured: seam step 0.94 vs normal frame step 0.98 on the main overlay).

## Content specifications (copy + limits)

| Slot | Current copy | Limit | Overflow rule |
|---|---|---|---|
| LIVE badge | `LIVE` | 4 chars | fixed |
| Cam label | `CAM 01` | 8 chars | fixed |
| Ticker items | `KHAN.U$TAY` `LIVE` `TURN IT UP` `NEW MUSIC` | 18 chars per item, 3-6 items | scrolls, never truncates |
| Starting soon title | `STARTING SOON` | 16:9: 15 chars, 9:16: 10 per line | shrink font, never wrap a word |
| Starting soon sub-line | `ESTABLISHING CONNECTION` | 32 chars (16:9), 26 (9:16) | shorten copy |
| BRB title | `BE RIGHT BACK` | as above | |
| BRB sub-line | `SIGNAL LOST - STAND BY` | as above | |
| Ending title | `THANK YOU` / `FOR LISTENING` | 14 chars per line | 2 lines max |
| Ending sub-line | `STREAM ENDED - SEE YOU NEXT TIME` | 32 chars | |

All overlay text is uppercase. Copy recommendations from the UX-copy pass are below.

## UX copy (from /ux-copy)

Voice: the overlay talks like the machine in the GIFs: short uppercase system messages
(status, signal, coordinates), never chatty. One idea per line.

| Slot | Recommended | Why |
|---|---|---|
| Starting soon sub-line | `ESTABLISHING CONNECTION` (keep) | Matches the first frame of the Keanu video, so the stream opens the way the video does |
| BRB sub-line | `SIGNAL LOST - STAND BY` (keep) | Tells viewers it's a pause, not a crash, in the brand's TV-signal language |
| Ending sub-line | `MISS ME? > YES / NO` (change) | Callback to the MISS ME? card; "STREAM ENDED - SEE YOU NEXT TIME" is generic |
| Ticker | `KHAN.U$TAY • LIVE NOW • NEW SINGLE "KEANU" • TURN IT UP` (change) | "NEW MUSIC" says nothing; naming the song gives viewers something to search for |

Alternatives:

| Slot | Option | Copy | Tone | Best for |
|---|---|---|---|---|
| Starting soon | A | `ESTABLISHING CONNECTION` | calm system | default |
| | B | `PRESS PLAY` | direct | a release-day stream (references the PLAY gif) |
| | C | `NEXT STEP: LOADING` | teasing | an announcement stream (references the NEXT STEP gif) |
| BRB | A | `SIGNAL LOST - STAND BY` | calm | default |
| | B | `RECONNECTING...` | neutral | short technical breaks |
| Ending | A | `MISS ME? > YES / NO` | playful | default |
| | B | `SIGNING OFF` | warm | late-night streams |
| Ticker add-on | - | `TARGET COORD: <city>` | HUD | tour/city streams (references the wireframe-map gif) |

Localization: the voice depends on English wordplay ("MISS ME?", "SIGNAL LOST"); translate
the meaning, not the words, and keep it uppercase and terminal-short. German/French run
~30% longer: shorten copy rather than shrink the 190 px titles below 150 px.

## Edge cases

- **Webcam not 16:9**: crop to fill the 544x306 window in OBS; never stretch.
- **Long ticker list**: the loop scrolls exactly 2 text widths per 10 s, so a longer list
  scrolls faster. Above ~110 characters total, split into two overlays or drop items.
- **Ticker text change**: requires a re-render (video). A live HTML rebuild would read
  `items[]` from a file instead.
- **Dark camera feed**: the frame stays readable (neon strokes have their own glow); nothing
  in the main overlay relies on the content behind it.
- **Bright camera feed**: ticker keeps its 72% dark bar; the LIVE badge is filled, not outlined.
- **Vertical apps**: TikTok/IG draw their own UI over the bottom 25% and right edge; nothing
  of ours sits there.
- **Hardware decoding on**: VP9 transparency is lost and the overlay shows black. Turn
  hardware decoding off for these sources.

## Accessibility notes

- **Photosensitivity**: the brightest flashes (BRB static, 7 frames every 3.3 s) and glitch
  bursts stay well under WCAG 2.3.1's three-flashes-per-second limit. Keep it that way in any
  rebuild: no new strobe effects.
- **Contrast**: yellow ticker on the 72% dark bar and white "LIVE" on pink both exceed 4.5:1;
  `color-terminal` sub-lines on `color-void` exceed 7:1.
- **Text size**: smallest on-screen text is 22 px (CAM label), decorative; every message
  viewers need to read is 30 px or larger at 1080p.
- **No colour-only meaning**: LIVE is spelled out, not just a red dot; card states are named
  in words.
- Overlays are pixels in the stream, so ARIA, focus order and keyboard interaction do not apply.
  For screen-reader users the stream title and description should carry the same status
  ("Starting soon", "Be right back").

# KHAN.u$TAY stream overlay

Ten-second seamless loops, 30 fps, VP9 WebM with transparency.

| Screen | Widescreen (Twitch / YouTube) | Vertical (TikTok / IG Live) |
|---|---|---|
| Main live (transparent middle) | `khanustay_overlay_main_16x9.webm` | `khanustay_overlay_main_9x16.webm` |
| Starting soon | `khanustay_overlay_soon_16x9.webm` | `khanustay_overlay_soon_9x16.webm` |
| Be right back | `khanustay_overlay_brb_16x9.webm` | `khanustay_overlay_brb_9x16.webm` |
| Stream ending | `khanustay_overlay_end_16x9.webm` | `khanustay_overlay_end_9x16.webm` |

## OBS / Streamlabs setup

1. In a scene, add **Media Source** and pick the WebM.
2. Tick **Loop**. Leave "Use hardware decoding" off (VP9 transparency needs software decoding).
3. For the main overlay, put it at the **top** of the source list so your camera and
   capture sit underneath it. Widescreen: fit your webcam inside the "CAM 01" frame
   (bottom-left, 544x306 at x=56, y=642).
4. Make one scene each for Starting soon, Be right back and Stream ending with just that
   card (they fill the screen).

The `preview/` folder has MP4 previews (overlay over footage, and the three cards).
`overlay_key.png` is a one-page key: every part of the main overlay numbered and explained,
plus the four scenes with suggested hotkeys F1 Starting soon, F2 Live, F3 Be right back,
F4 Stream ending (set them in OBS: Settings > Hotkeys > each scene > Switch to scene).

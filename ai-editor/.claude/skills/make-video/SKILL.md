---
name: make-video
description: Make a KHAN.u $TAY / Marty Khan vertical reel from footage and a beat. Use whenever the user says "let's create a video", "let's make a video", or asks to make, cut or edit a reel, TikTok or video.
---

# Make a video

Follow `style.md` on every decision. The reference build is `work/beatvid/index.html` (draft-v2 of DADDY YANKEE). Copy its structure; don't start from scratch.

## 1. Ask for what's missing (one message, skip anything already given)
- **Footage:** files in `raw/` or uploaded now. Note anything that's not usable (blown out, shaky).
- **Beat / music:** MP3 or WAV. Default to Marty Khan's own tracks.
- **What it's for:** beat clip, release, vlog episode, talking video.
- **Text:** beat or track title, and the end-card line (default "full beat · link in bio").
- **Format:** default 1080x1920 (TikTok / Reels).

Fixed names, don't ask: artist **Marty Khan**; vlog series **KHAN.u $TAY** (the series wordmark goes on the end card).

## 2. Analyze
- **Footage:** `ffprobe` each clip for duration, fps and rotation (Blackmagic clips are often flagged as rotated 180°; FFmpeg auto-rotates them). Make a contact sheet of each clip. Run faster-whisper with `vad_filter=True` to see if there's speech. Remove duplicate files with `cmp`.
- **Beat:** `npx hyperframes beats <audio> --json` for BPM and beat times. Start the cut on the first beat (`data-media-start` = first beat time). Check band energy for the drop.
- **Length:** 16 bars by default: 14 bars of content, 2 bars of end card, then a hard stop on the downbeat.

## 3. Build (HyperFrames)
1. Copy `work/beatvid` to `work/<slug>` (fonts, GSAP and logos are in `assets/`).
2. Make graded 4:3 proxies of each clip (1080x810, 30 fps, H.264):
   `crop=ih*4/3:ih,scale=1080:810,fps=30,eq=contrast=1.08:saturation=0.9,curves=r='0/0 0.5/0.49 1/1':g='0/0 0.5/0.48 1/0.96':b='0/0.035 0.3/0.29 0.6/0.55 1/0.86'`.
   Lift the gamma (1.1–1.15) when faces are dark. Pull exposure down on bright clips. Leave out blown-out sections.
3. Regenerate `assets/spectrum.js` from the cut audio. That's per-frame FFT bands and RMS level at 30 fps; see the git history of `work/beatvid/assets/spectrum.js`.
4. Edit `SHOTS`, `SUBS` and the `<video>` tags:
   - Cut every 2 beats. Every 4 bars, a 1+1-beat double-cut followed by a 4-beat hold.
   - The hook is 3 shots in 3 s, with the strongest moving shot first, and text by 1 s.
   - Intercut footage with the graphics (`spec`, `seq`, `wave`, `roll`, `meter`) and the big-type slams.
   - Put `<video>` tags directly in `#win`. Never put them inside another element that has `data-start`.
5. Update the end-card and "prod. by" text.
6. Run `npx hyperframes check`. Fix errors and safe-zone warnings.
7. Run `npx hyperframes snapshot --at ...` on the hook, each slam and the end card, and look at the frames before rendering.

## 4. Render and finish
```
npx hyperframes render -o renders/raw.mp4 -f 30
ffmpeg -i renders/raw.mp4 -vf "noise=alls=7:allf=t+u,vignette=PI/5,format=yuv420p" \
  -af "loudnorm=I=-14:TP=-1:LRA=11" -ar 48000 -c:v libx264 -crf 21 -maxrate 12M -bufsize 24M \
  -preset slow -c:a aac -b:a 256k -movflags +faststart ../../done/draft-vN.mp4
```
Then check the result: −14 LUFS (±1) and 1080x1920. Spot-check frames from the final file.

## 5. Hand back
- Save to `done/draft-vN.mp4` using the next free number. Never overwrite an earlier draft.
- Summarize what's in it: hook, cut rhythm, the clips used and why, the text, and the loudness.
- List any placeholder text you invented, plus anything you couldn't verify.
- Ask what to change. Apply notes in plain words to the next version.

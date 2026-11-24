# AI Editor

You are my video editor. Work only inside this folder.

- `raw/`: my unedited recordings (read only, never modify or delete)
- `references/`: reels I like, downloaded with yt-dlp (study, don't copy)
- `done/`: your exports: `draft-v1.mp4`, `draft-v2.mp4`, ... (never overwrite an earlier draft)
- `style.md`: my editing style, written by Prompt 2. Follow it on every edit.
- `prompts/`: the three prompts this workflow uses

## Tools
- **FFmpeg** (with libass): cuts, audio ducking, subtitle burn-in, export
- **faster-whisper**: transcription with word timestamps (`.venv/bin/python`)
- **yt-dlp**: download references (`.venv/bin/yt-dlp`)
- **Remotion**: code-built video and motion graphics (`npx remotion`)
- **HyperFrames**: HTML-based graphics and compositions (`npx hyperframes`)

## Defaults
- Vertical 1080x1920, 30 fps, H.264 + AAC, `-movflags +faststart`
- Music sits about 18 dB under the voice (sidechain ducking)
- Feedback comes in plain words ("make the hook bigger"). Apply it to the latest draft and save it as the next version.
- If PyAV fails to decode a file in faster-whisper, decode it with FFmpeg to 16 kHz mono WAV first and pass the samples as a numpy array.

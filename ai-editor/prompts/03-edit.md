# Prompt 3 — edit

Shoot the way you always do, drop the recording into `raw/`, then paste:

```
Edit the newest video in raw using my style.md.
1. Transcribe it with faster-whisper (word-level timestamps).
2. Cut the pauses, dead air and false starts with FFmpeg.
3. Add word-by-word subtitles styled per style.md (ASS file, burned in with libass).
4. Lay music under it, quiet under the voice (duck it), if style.md calls for music.
5. Build any titles or graphics with Remotion or HyperFrames.
6. Export a vertical 1080x1920 MP4 to done/ as draft-v1.mp4.
Then tell me what you changed so I can review it.
```

## Notes in plain words

Don't like something? Just say it, e.g. *"make the hook bigger"*. Claude saves
the next version as `draft-v2.mp4`, and so on.

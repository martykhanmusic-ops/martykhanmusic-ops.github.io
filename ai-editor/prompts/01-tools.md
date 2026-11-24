# Prompt 1 — tools

Paste this into a new **Claude Code → Local** chat pointed at your `AI Editor` folder.

```
You're my video editor. We work in this folder: raw, references, done.
Install and verify 5 tools:
FFmpeg with libass, faster-whisper, yt-dlp, Remotion, HyperFrames.
Check what's installed first and only install what's missing.
Use a local Python venv (.venv) for faster-whisper and yt-dlp, and a local
package.json for Remotion and HyperFrames. Confirm FFmpeg has the
"subtitles" filter (libass). When done, show me a table: tool | version.
```

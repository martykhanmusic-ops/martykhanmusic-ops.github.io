# AI Editor: a Claude Code video-editing workflow

## Setup (once)
1. Install the **Claude desktop app** and open the **Code** tab (not the browser).
2. Copy this `ai-editor` folder to your computer, e.g. `~/Desktop/AI Editor`.
   It already has `raw/`, `references/` and `done/` in it.
3. In Claude Code: **New session → Local → select the `AI Editor` folder.**
4. Install the 5 tools. Either run `bash setup.sh`, or paste `prompts/01-tools.md`
   and let Claude do it.

| Tool | Job |
|---|---|
| Remotion | builds the video |
| HyperFrames | builds the graphics |
| FFmpeg (libass) | cuts and exports |
| faster-whisper | subtitles |
| yt-dlp | downloads references |

## Teach it your taste (once)
Paste `prompts/02-taste.md` with 3–5 reel links. Claude writes `style.md`.

## Every video
Drop the recording into `raw/` and paste `prompts/03-edit.md`. Review the draft in
`done/`, then give notes in plain words ("make the hook bigger").

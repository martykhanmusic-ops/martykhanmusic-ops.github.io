# Claude instructions

## Video and audio: always use ffmpeg-skill

For any task that touches video or audio (mp4, mov, webm, wav, mp3, m4a, footage,
captions/subtitles, reels/shorts, platform exports, loudness, trimming, joining,
reframing, thumbnails, or anything that would call `ffmpeg`/`ffprobe`), always invoke
the `ffmpeg-skill` skill first and follow its workflow (probe first, verify last).
Do not hand-write ffmpeg commands when one of the skill's scripts covers the job.

## Video deliverables: always three formats

Every finished video edit is delivered in widescreen (16:9, 1920x1080) and vertical
(9:16, 1080x1920) as well as its native shape. Place text for each format separately
(vertical: inside the Reels/TikTok safe zone), and check each with `check.py`.

## Edit style preferences

- Cuts are instantaneous: no crossfades, dissolves or see-through overlays of the next
  or previous clip. Make neighbouring clips flow by reworking the clip itself
  (colour-matching, zoom in/out on the cut), never by overlapping two clips.
- Lyrics/captions: white text, no background box or colour block.

The skill lives in `.claude/skills/ffmpeg-skill` (upstream: https://github.com/kajisho5/ffmpeg-skill, v4.7.1, MIT).
It needs FFmpeg 6.1+ and Python 3.10+.

# Claude instructions

## Video and audio: always use ffmpeg-skill

For any task that touches video or audio (mp4, mov, webm, wav, mp3, m4a, footage,
captions/subtitles, reels/shorts, platform exports, loudness, trimming, joining,
reframing, thumbnails, or anything that would call `ffmpeg`/`ffprobe`), always invoke
the `ffmpeg-skill` skill first and follow its workflow (probe first, verify last).
Do not hand-write ffmpeg commands when one of the skill's scripts covers the job.

The skill lives in `.claude/skills/ffmpeg-skill` (upstream: https://github.com/kajisho5/ffmpeg-skill, v4.7.1, MIT).
It needs FFmpeg 6.1+ and Python 3.10+.

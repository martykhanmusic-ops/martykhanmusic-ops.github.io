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
- Lyric style (TikTok lyric-snippet look): lowercase white narrow sans (Liberation
  Sans at ~80% width), each word pops on exactly when it is sung, lines build up
  word by word in short 2-3 word rows with uneven gaps, placed over the upper-left
  of the picture (position varies a little per phrase), soft shadow only.
- Logos: no Marty Khan logos/signatures at all (many GIFs flash them for part of
  their loop: check every clip frame by frame and keep only clean stretches, or crop
  the logo out). Use B-roll instead. At most 1-2 KHAN.u$TAY logos per video, each
  shown once.
- Widescreen must fill the whole 16:9 frame: rebuild each clip at 16:9 from its
  source (zoom in, cropping at most ~12% of the height), then fill any remaining
  width with mirrored copies of the clip. No black bars, no blurred side panels.
- Lyrics appear only while they are sung: time every line from word-level timestamps
  (first sung word -> last sung word), never from coarse segment times. Nothing on
  screen during intros, instrumentals or gaps. Verify line starts against word times.
- Cuts land on the drums: detect kick and snare hits on the percussive part of the
  track and cut on real hits, not on an assumed BPM grid (verify the tempo; detectors
  misread it). Hold title/text clips long enough to read (>= ~1.3 s).

The skill lives in `.claude/skills/ffmpeg-skill` (upstream: https://github.com/kajisho5/ffmpeg-skill, v4.7.1, MIT).
It needs FFmpeg 6.1+ and Python 3.10+.

#!/usr/bin/env bash
# Installs the AI Editor workflow into this folder (macOS or Linux).
# Usage: bash setup.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p raw references done

have() { command -v "$1" >/dev/null 2>&1; }
OS="$(uname -s)"

# 1. FFmpeg with libass
if ! have ffmpeg; then
  if [ "$OS" = "Darwin" ]; then
    have brew || { echo "Install Homebrew first: https://brew.sh"; exit 1; }
    brew install ffmpeg
  else
    sudo apt-get update && sudo apt-get install -y ffmpeg
  fi
fi
ffmpeg -hide_banner -filters 2>/dev/null | grep -q " subtitles " \
  || echo "WARNING: your FFmpeg has no libass (subtitles filter). Reinstall a full build."

# 2-3. faster-whisper + yt-dlp in a local venv
have python3 || { echo "Install Python 3 first"; exit 1; }
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q --upgrade pip faster-whisper yt-dlp

# 4-5. Remotion + HyperFrames
have npm || { echo "Install Node.js 18+ first: https://nodejs.org"; exit 1; }
[ -f package.json ] || echo '{ "name": "ai-editor", "private": true, "type": "module" }' > package.json
npm install --no-fund --no-audit remotion @remotion/cli @remotion/renderer react react-dom hyperframes

echo
printf "%-16s %s\n" tool version
printf "%-16s %s\n" FFmpeg "$(ffmpeg -version | head -1 | awk '{print $3}')"
printf "%-16s %s\n" faster-whisper "$(.venv/bin/python -c 'import faster_whisper as f;print(f.__version__)')"
printf "%-16s %s\n" yt-dlp "$(.venv/bin/yt-dlp --version)"
printf "%-16s %s\n" Remotion "$(node -p "require('./node_modules/remotion/package.json').version")"
printf "%-16s %s\n" HyperFrames "$(npx --no-install hyperframes --version | tail -1)"
echo
echo "Done. Next: open Claude Code > Local on this folder and paste prompts/02-taste.md"

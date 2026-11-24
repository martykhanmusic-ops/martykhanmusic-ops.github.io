# Pulls the latest AI Editor rules, style, trigger skill and video template into Desktop\AI Editor.
# Run: irm https://raw.githubusercontent.com/martykhanmusic-ops/martykhanmusic-ops.github.io/claude/admiring-shannon-fwr3ud/ai-editor/update.ps1 | iex
$ErrorActionPreference = 'Stop'
$base = 'https://raw.githubusercontent.com/martykhanmusic-ops/martykhanmusic-ops.github.io/claude/admiring-shannon-fwr3ud/ai-editor'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'AI Editor'
$files = @(
  'CLAUDE.md', 'AGENTS.md', 'style.md', 'README.md',
  'prompts/01-tools.md', 'prompts/02-taste.md', 'prompts/03-edit.md',
  '.claude/skills/make-video/SKILL.md',
  'references/brand/logo-serif-stacked.png', 'references/brand/logo-pink-drip.png',
  'work/beatvid/index.html', 'work/beatvid/hyperframes.json', 'work/beatvid/meta.json', 'work/beatvid/package.json',
  'work/beatvid/assets/gsap.min.js', 'work/beatvid/assets/spectrum.js',
  'work/beatvid/assets/anton-latin-400-normal.woff2', 'work/beatvid/assets/inter-latin-700-normal.woff2',
  'work/beatvid/assets/inter-latin-900-normal.woff2',
  'work/beatvid/assets/wordmark-distressed.png', 'work/beatvid/assets/logo-serif-stacked.png'
)
foreach ($f in $files) {
  $dest = Join-Path $root ($f -replace '/', '\')
  New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
  Invoke-WebRequest "$base/$f" -OutFile $dest -UseBasicParsing
  Write-Host "updated $f"
}
Write-Host "Done. Open Claude Code on '$root' and say: let's make a video" -ForegroundColor Green

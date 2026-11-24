# AI Editor - Windows installer
# Builds "AI Editor" on your Desktop (raw, references, done + prompts) and installs
# FFmpeg (libass), faster-whisper, yt-dlp, Remotion and HyperFrames.
#
# Run in PowerShell:
#   irm https://raw.githubusercontent.com/martykhanmusic-ops/martykhanmusic-ops.github.io/claude/admiring-shannon-fwr3ud/ai-editor/setup.ps1 | iex

$ErrorActionPreference = 'Stop'
$base = 'https://raw.githubusercontent.com/martykhanmusic-ops/martykhanmusic-ops.github.io/claude/admiring-shannon-fwr3ud/ai-editor'
$root = Join-Path ([Environment]::GetFolderPath('Desktop')) 'AI Editor'

function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
              [Environment]::GetEnvironmentVariable('Path', 'User')
}
function Have($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Winget-Install($id) {
  if (-not (Have winget)) { throw "winget not found. Install 'App Installer' from the Microsoft Store, then re-run." }
  winget install --id $id -e --accept-source-agreements --accept-package-agreements --silent
  Refresh-Path
}

# --- Folder structure -------------------------------------------------------
Write-Host "Building $root" -ForegroundColor Yellow
foreach ($d in 'raw', 'references', 'done', 'prompts') {
  New-Item -ItemType Directory -Force -Path (Join-Path $root $d) | Out-Null
}
foreach ($f in 'CLAUDE.md', 'README.md', 'package.json', '.gitignore',
               'prompts/01-tools.md', 'prompts/02-taste.md', 'prompts/03-edit.md') {
  $dest = Join-Path $root ($f -replace '/', '\')
  if (-not (Test-Path $dest)) { Invoke-WebRequest "$base/$f" -OutFile $dest -UseBasicParsing }
}
Set-Location $root

# --- 1. FFmpeg (full build, includes libass) --------------------------------
if (-not (Have ffmpeg)) { Winget-Install 'Gyan.FFmpeg' }
if (-not ((ffmpeg -hide_banner -filters 2>$null) -match ' subtitles ')) {
  Write-Warning 'Your FFmpeg has no libass (subtitles filter). Run: winget install Gyan.FFmpeg'
}

# --- 2-3. faster-whisper + yt-dlp in a local venv ---------------------------
$py = $null
if (Have py) { $py = 'py' } elseif ((Have python) -and ((python --version 2>&1) -match 'Python 3')) { $py = 'python' }
if (-not $py) { Winget-Install 'Python.Python.3.12'; $py = 'py' }
if (-not (Test-Path '.venv')) { & $py -3 -m venv .venv 2>$null; if (-not (Test-Path '.venv')) { & $py -m venv .venv } }
$vpy = Join-Path $root '.venv\Scripts\python.exe'
& $vpy -m pip install -q --upgrade pip faster-whisper yt-dlp

# --- 4-5. Remotion + HyperFrames --------------------------------------------
if (-not (Have npm)) { Winget-Install 'OpenJS.NodeJS.LTS' }
npm install --no-fund --no-audit remotion @remotion/cli @remotion/renderer react react-dom hyperframes

# --- Verify -----------------------------------------------------------------
Write-Host ''
'{0,-16} {1}' -f 'tool', 'version'
'{0,-16} {1}' -f 'FFmpeg', ((ffmpeg -version | Select-Object -First 1) -split ' ')[2]
'{0,-16} {1}' -f 'faster-whisper', (& $vpy -c 'import faster_whisper as f;print(f.__version__)')
'{0,-16} {1}' -f 'yt-dlp', (& (Join-Path $root '.venv\Scripts\yt-dlp.exe') --version)
'{0,-16} {1}' -f 'Remotion', (node -p "require('./node_modules/remotion/package.json').version")
'{0,-16} {1}' -f 'HyperFrames', (node -p "require('./node_modules/hyperframes/package.json').version")
Write-Host ''
Write-Host "Done. Open the Claude app > Code > New session > Local > select '$root'," -ForegroundColor Green
Write-Host 'then paste prompts\02-taste.md with 3-5 reel links.' -ForegroundColor Green

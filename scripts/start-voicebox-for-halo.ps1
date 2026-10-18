$ErrorActionPreference = 'Stop'
$voiceboxRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\voicebox') -ErrorAction Stop).Path
$python = Join-Path $voiceboxRoot 'backend\venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) { throw 'Voicebox Python environment is missing. Read voicebox/LOCAL_SETUP.md.' }
$env:VOICEBOX_CORS_ORIGINS = 'http://localhost:4173'
Write-Host 'Starting local Voicebox for Halo at http://127.0.0.1:17493'
Write-Host 'Keep this window open. Voice models may download on first use.'
Push-Location $voiceboxRoot
try { & $python -m uvicorn backend.main:app --host 127.0.0.1 --port 17493 }
finally { Pop-Location }

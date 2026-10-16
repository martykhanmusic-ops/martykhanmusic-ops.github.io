$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$out = Join-Path $root 'dist'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$archivePath = Join-Path $out 'halo-site.zip'
$exePath = Join-Path $out 'Halo.exe'
Add-Type -AssemblyName System.IO.Compression
$tracked = git -C $root ls-files -- 'index.html' 'halo/**'
if ($LASTEXITCODE -ne 0 -or -not $tracked) { throw 'Could not find tracked Halo site files.' }
$stream = [System.IO.File]::Open($archivePath, [System.IO.FileMode]::Create)
try {
  $archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    foreach ($file in $tracked) {
      $source = Join-Path $root $file
      if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing site file: $file" }
      $entry = $archive.CreateEntry($file.Replace('\','/'), [System.IO.Compression.CompressionLevel]::Optimal)
      $input = [System.IO.File]::OpenRead($source)
      $output = $entry.Open()
      try { $input.CopyTo($output) } finally { $output.Dispose(); $input.Dispose() }
    }
  } finally { $archive.Dispose() }
} finally { $stream.Dispose() }
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { throw 'Windows .NET Framework C# compiler is unavailable.' }
& $compiler /nologo /target:exe /out:$exePath /reference:System.IO.Compression.dll /resource:"${archivePath},HaloSite" (Join-Path $root 'launcher\HaloLauncher.cs')
if ($LASTEXITCODE -ne 0) { throw 'Halo launcher compilation failed.' }
Remove-Item -LiteralPath $archivePath
Write-Host "Built $exePath"

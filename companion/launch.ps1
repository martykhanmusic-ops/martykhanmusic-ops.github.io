param([Parameter(Mandatory=$true)][string]$ShortcutPath, [string]$ProjectPath)
$ErrorActionPreference = 'Stop'
if ($ProjectPath) {
  if (-not (Test-Path -LiteralPath $ProjectPath -PathType Leaf)) { throw 'Approved project file was not found.' }
  $shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut($ShortcutPath)
  $target = $shortcut.TargetPath
  $shortcutName = [System.IO.Path]::GetFileName($ShortcutPath)
  $projectExtension = [System.IO.Path]::GetExtension($ProjectPath)
  $targetName = [System.IO.Path]::GetFileName($target)
  $approved = ($shortcutName -ieq 'Ableton Live 12 Suite.lnk' -and $projectExtension -ieq '.als' -and $targetName -ieq 'Ableton Live 12 Suite.exe') -or
              ($shortcutName -ieq 'FL Studio 2026.lnk' -and $projectExtension -ieq '.flp' -and $targetName -ieq 'FL64.exe')
  if (-not $approved -or -not (Test-Path -LiteralPath $target -PathType Leaf)) { throw 'Approved DAW project association was not found.' }
  Start-Process -FilePath $target -ArgumentList ('"' + $ProjectPath + '"')
} else {
  Start-Process -FilePath $ShortcutPath
}

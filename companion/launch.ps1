param([Parameter(Mandatory=$true)][string]$ShortcutPath, [string]$ProjectPath)
$ErrorActionPreference = 'Stop'
if ($ProjectPath) {
  if (-not (Test-Path -LiteralPath $ProjectPath -PathType Leaf)) { throw 'Approved project file was not found.' }
  $shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut($ShortcutPath)
  $target = $shortcut.TargetPath
  if ([System.IO.Path]::GetFileName($target) -ne 'Ableton Live 12 Suite.exe' -or -not (Test-Path -LiteralPath $target -PathType Leaf)) { throw 'Approved Ableton target was not found.' }
  Start-Process -FilePath $target -ArgumentList ('"' + $ProjectPath + '"')
} else {
  Start-Process -FilePath $ShortcutPath
}

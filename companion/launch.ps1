param([Parameter(Mandatory=$true)][string]$ShortcutPath)
$ErrorActionPreference = 'Stop'
Start-Process -FilePath $ShortcutPath

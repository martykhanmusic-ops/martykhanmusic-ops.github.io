param([Parameter(Mandatory=$true)][string]$ListenHost)
$ErrorActionPreference='Stop'
$address=$null
if(-not [Net.IPAddress]::TryParse($ListenHost,[ref]$address) -or $address.AddressFamily -ne 'InterNetwork' -or $ListenHost -notmatch '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)'){throw 'Choose the private IPv4 Wi-Fi address.'}
$openssl='C:\Program Files\Git\usr\bin\openssl.exe'
if(-not (Test-Path -LiteralPath $openssl)){throw 'OpenSSL from Git for Windows is required for local TLS setup.'}
$folder=Join-Path $env:LOCALAPPDATA ('Halo\LiveListen\tls-'+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $folder -Force | Out-Null
$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
& icacls.exe $folder /inheritance:r /grant:r "*${sid}:(OI)(CI)F" | Out-Null
if($LASTEXITCODE -ne 0){throw 'Could not restrict private-key folder permissions.'}
& $openssl req -x509 -newkey rsa:2048 -nodes -days 30 -keyout (Join-Path $folder 'ca-key.pem') -out (Join-Path $folder 'ca.pem') -subj '/CN=Halo Local Listen CA' -addext 'basicConstraints=critical,CA:TRUE,pathlen:0' -addext 'keyUsage=critical,keyCertSign,cRLSign' 2>$null
if($LASTEXITCODE -ne 0){throw 'Local CA generation failed.'}
& $openssl req -newkey rsa:2048 -nodes -keyout (Join-Path $folder 'server-key.pem') -out (Join-Path $folder 'server.csr') -subj '/CN=Halo Local Listen' 2>$null
if($LASTEXITCODE -ne 0){throw 'Server key generation failed.'}
@"
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=IP:$ListenHost,IP:127.0.0.1
"@ | Set-Content -LiteralPath (Join-Path $folder 'server.ext') -Encoding ascii
& $openssl x509 -req -in (Join-Path $folder 'server.csr') -CA (Join-Path $folder 'ca.pem') -CAkey (Join-Path $folder 'ca-key.pem') -CAcreateserial -out (Join-Path $folder 'server.pem') -days 30 -extfile (Join-Path $folder 'server.ext') 2>$null
if($LASTEXITCODE -ne 0){throw 'Certificate signing failed.'}
& $openssl x509 -in (Join-Path $folder 'ca.pem') -outform DER -out (Join-Path $folder 'halo-listen.cer')
if($LASTEXITCODE -ne 0){throw 'Public certificate export failed.'}
Write-Output "TLS files: $folder"
Write-Output 'No certificate was installed or trusted on Windows or iPhone. The CA expires in 30 days.'
Get-FileHash -LiteralPath (Join-Path $folder 'halo-listen.cer') -Algorithm SHA256 | Format-List
Write-Output "Start: node live-listen/relay/server.mjs --listen-host=$ListenHost --cert=`"$folder\server.pem`" --key=`"$folder\server-key.pem`""

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (-not $env:PORT) {
  $env:PORT = "4174"
}

$bundledNode = "C:\Users\zf\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if (Test-Path $bundledNode) {
  $node = $bundledNode
} else {
  $nodeCommand = Get-Command node -ErrorAction Stop
  $node = $nodeCommand.Source
}

$localIps = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
  } |
  Select-Object -ExpandProperty IPAddress -Unique

Write-Host ""
Write-Host "Service Design Studio is starting..." -ForegroundColor Cyan
Write-Host "Teacher local URL: http://127.0.0.1:$env:PORT/" -ForegroundColor Green
foreach ($ip in $localIps) {
  Write-Host "Student LAN URL: http://$ip`:$env:PORT/" -ForegroundColor Green
}
Write-Host ""
Write-Host "Keep this window open while students are using the app." -ForegroundColor Yellow
Write-Host "Data file: $scriptDir\data\classroom-state.json"
Write-Host ""

& $node server.mjs


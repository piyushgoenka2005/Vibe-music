# One-time deploy access setup (run locally, no passwords stored).

$ErrorActionPreference = "Stop"
$keyDir = Join-Path $env:USERPROFILE ".ssh"
$keyPath = Join-Path $keyDir "vibe_vps_deploy"
$pubPath = "$keyPath.pub"

if (-not (Test-Path $pubPath)) {
  New-Item -ItemType Directory -Force -Path $keyDir | Out-Null
  ssh-keygen -t ed25519 -f $keyPath -N '""' -C "vibe-deploy-cursor"
}

$publicKey = (Get-Content $pubPath -Raw).Trim()
Set-Clipboard -Value $publicKey

Write-Host ""
Write-Host "STEP 1 - CloudOnFire (about 30 seconds)"
Write-Host "Public key copied to clipboard."
Write-Host "1. Open https://cp.cloudonfire.com/"
Write-Host "2. Left menu: SSH Keys -> Add SSH Key"
Write-Host "3. Paste from clipboard and save"
Write-Host "4. List VPS -> your server -> Settings -> SSH Keys -> attach this key"
Write-Host ""
Write-Host "Public key:"
Write-Host $publicKey
Write-Host ""
Write-Host "Private key file for GitHub secret VPS_SSH_KEY:"
Write-Host $keyPath
Write-Host ""

Start-Process "https://cp.cloudonfire.com/"

# Run from the dev machine BEFORE re-running the GitHub deploy workflow.
# Verifies the local deploy key is accepted by the VPS and prints the exact
# GitHub secrets to configure.
#
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\ops\verify-ssh.ps1 [-User root] [-Host vps]

param(
    [string]$User = "root",
    [string]$VpsHost = "87.232.72.14",
    [int]$Port = 22
)

$ErrorActionPreference = "Stop"
$key = Join-Path $env:USERPROFILE ".ssh\vibe_vps_deploy"

if (-not (Test-Path $key)) {
    Write-Error "Deploy key not found at $key"
}

Write-Host "==> Testing ssh ${User}@${VpsHost}:${Port} with vibe_vps_deploy key..."
$output = ssh -i $key -p $Port -o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new `
    "$User@$VpsHost" "echo SSH_OK; cd ~/Vibe-music 2>/dev/null && echo REPO_FOUND && git log --oneline -1" 2>&1

if ($output -match "SSH_OK") {
    Write-Host ""
    Write-Host "SUCCESS — the VPS accepts this key." -ForegroundColor Green
    $output | ForEach-Object { Write-Host "    $_" }
    if ($output -notmatch "REPO_FOUND") {
        Write-Warning "~/Vibe-music not found for user '$User' — check where the app lives."
    }
    Write-Host ""
    Write-Host "GitHub → Settings → Secrets → Actions:"
    Write-Host "    VPS_HOST = $VpsHost"
    Write-Host "    VPS_USER = $User"
    Write-Host "    VPS_PORT = $Port"
    Write-Host "    VPS_SSH_KEY = contents of $key (PRIVATE key)"
    Write-Host ""
    Write-Host "Then: Actions → Deploy production (vibemusic.in) → Re-run jobs"
    exit 0
}

Write-Host ""
Write-Host "STILL FAILING:" -ForegroundColor Red
$output | ForEach-Object { Write-Host "    $_" }
Write-Host ""
Write-Host "Fix: run install-deploy-key.sh inside the VPS web console first."
exit 1

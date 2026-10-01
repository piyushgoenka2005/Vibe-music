# Run from the dev machine BEFORE re-running the GitHub deploy workflow.
# Verifies the local deploy key is accepted by the VPS and prints the exact
# GitHub secrets to configure.
#
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\ops\verify-ssh.ps1 [-User root] [-Host vps]

param(
    [string]$User = "root",
    [string]$VpsHost = "109.122.56.126",
    [int]$Port = 22
)

$ErrorActionPreference = "Continue"
$key = Join-Path $env:USERPROFILE ".ssh\vibe_vps_deploy"
# Fingerprint of YOUR VPS (from CloudOnFire console / VPS 1055). Not the Gitea host on the same IP.
$ExpectedVpsHostKey = "SHA256:l0hpirMy/wrm0gRH4SNxl4PdMmpzKXtSFOjfMESvX7I"
$KnownWrongHostKey = "SHA256:vjfQl9pdbsCqLuAEOVL451bbtscQSyiC0APZ0iIwv2k"

if (-not (Test-Path $key)) {
    Write-Error "Deploy key not found at $key"
}

Write-Host "==> Probing SSH host key on ${VpsHost}:${Port}..."
$probe = (ssh -i $key -p $Port -o BatchMode=yes -o ConnectTimeout=12 -o StrictHostKeyChecking=no `
    -o UserKnownHostsFile=NUL -o PreferredAuthentications=none `
    "$User@$VpsHost" exit 2>&1) | Out-String
$hostKeyLine = ($probe | Select-String "Server host key: ssh-ed25519 (\S+)").Matches
if ($hostKeyLine.Count -gt 0) {
    $seen = $hostKeyLine[0].Groups[1].Value
    Write-Host "    Host key fingerprint: $seen"
    if ($seen -eq $KnownWrongHostKey) {
        Write-Host ""
        Write-Host "BLOCKED: This IP is answering with another customer's server (Forgejo/Gitea), not VPS 1055." -ForegroundColor Red
        Write-Host "Password SSH and deploy-key SSH will fail until CloudOnFire removes the duplicate IP."
        Write-Host "Contact CloudOnFire support (WhatsApp +91 95606 14171) for VPS 1055 on $VpsHost."
        Write-Host "Use CloudOnFire panel -> VPS 1055 -> VNC console until then."
        exit 2
    }
    if ($seen -ne $ExpectedVpsHostKey) {
        Write-Warning "Unexpected host key (not your VPS and not the known Gitea host). Proceeding with auth test..."
    }
}

Write-Host "==> Testing ssh ${User}@${VpsHost}:${Port} with vibe_vps_deploy key..."
$output = ssh -i $key -p $Port -o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new `
    "$User@$VpsHost" "echo SSH_OK; cd ~/Vibe-music 2>/dev/null && echo REPO_FOUND && git log --oneline -1" 2>&1

if ($output -match "SSH_OK") {
    Write-Host ""
    Write-Host "SUCCESS - the VPS accepts this key." -ForegroundColor Green
    $output | ForEach-Object { Write-Host "    $_" }
    if ($output -notmatch "REPO_FOUND") {
        Write-Warning "~/Vibe-music not found for user '$User' - check where the app lives."
    }
    Write-Host ""
    Write-Host "GitHub > Settings > Secrets > Actions:"
    Write-Host "    VPS_HOST = $VpsHost"
    Write-Host "    VPS_USER = $User"
    Write-Host "    VPS_PORT = $Port"
    Write-Host "    VPS_SSH_KEY = contents of $key (PRIVATE key)"
    Write-Host ""
    Write-Host "Then: Actions > Deploy production (vibemusic.in) > Re-run jobs"
    exit 0
}

Write-Host ""
Write-Host "STILL FAILING:" -ForegroundColor Red
$output | ForEach-Object { Write-Host "    $_" }
Write-Host ""
if ($output -match "Connection reset") {
    Write-Host 'Connection reset usually means the wrong machine on this IP dropped the session.'
    Write-Host 'Do not use password SSH. Use the deploy key after CloudOnFire fixes the IP conflict.'
}
Write-Host ""
Write-Host 'On YOUR VPS (CloudOnFire -> VPS 1055 -> VNC console as root), run:'
Write-Host '    curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/install-deploy-key.sh | bash'
Write-Host ""
Write-Host 'Then from this PC: ssh vibe-vps'
exit 1

# Connect to Vibe VPS only when the correct host key is seen (avoids Gitea host on same IP).
# Usage: powershell -ExecutionPolicy Bypass -File scripts\ops\ssh-vps.ps1
#        powershell -ExecutionPolicy Bypass -File scripts\ops\ssh-vps.ps1 -Command "pm2 status"

param(
    [string]$HostIp = "31.42.125.219",
    [string]$User = "root",
    [int]$Port = 22,
    [int]$MaxAttempts = 25,
    [string]$Command = ""
)

$key = Join-Path $env:USERPROFILE ".ssh\vibe_vps_deploy"
$expected = "SHA256:l0hpirMy/wrm0gRH4SNxl4PdMmpzKXtSFOjfMESvX7I"
$wrong = "SHA256:vjfQl9pdbsCqLuAEOVL451bbtscQSyiC0APZ0iIwv2k"

if (-not (Test-Path $key)) {
    Write-Error "Deploy key not found: $key"
}

ssh-keygen -R $HostIp 2>$null | Out-Null

for ($i = 1; $i -le $MaxAttempts; $i++) {
    $probe = (ssh -v -i $key -p $Port -o BatchMode=yes -o ConnectTimeout=8 `
        -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL `
        "${User}@${HostIp}" exit 2>&1) | Out-String
    $m = [regex]::Match($probe, "Server host key: ssh-ed25519 (\S+)")
    if (-not $m.Success) {
        Write-Host "Attempt $i/$MaxAttempts - no SSH response, retrying..."
        Start-Sleep -Seconds 1
        continue
    }
    $fp = $m.Groups[1].Value
    if ($fp -eq $wrong) {
        Write-Host "Attempt $i/$MaxAttempts - wrong host (Gitea), retrying..."
        Start-Sleep -Seconds 1
        continue
    }
    if ($fp -ne $expected) {
        Write-Warning "Attempt $i - unexpected fingerprint $fp (expected $expected)"
        Start-Sleep -Seconds 1
        continue
    }

    Write-Host "Correct VPS host key seen. Connecting..."
    $knownHosts = Join-Path $env:USERPROFILE ".ssh\known_hosts_vibe_vps"
    $sshArgs = @(
        "-i", $key,
        "-p", $Port,
        "-o", "IdentitiesOnly=yes",
        "-o", "UserKnownHostsFile=$knownHosts",
        "-o", "HostKeyAlgorithms=ssh-ed25519",
        "-o", "StrictHostKeyChecking=yes",
        "${User}@${HostIp}"
    )
    if ($Command) {
        & ssh @sshArgs $Command
    } else {
        & ssh @sshArgs
    }
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Could not reach your VPS after $MaxAttempts tries." -ForegroundColor Red
Write-Host "CloudOnFire still has two servers on $HostIp. Use VNC console or contact support."
exit 1

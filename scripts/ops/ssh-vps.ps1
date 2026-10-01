# Connect to Vibe VPS (CloudOnFire dedicated IP 109.122.56.126).
# Usage: powershell -ExecutionPolicy Bypass -File scripts\ops\ssh-vps.ps1
#        powershell -ExecutionPolicy Bypass -File scripts\ops\ssh-vps.ps1 -Command "pm2 status"

param(
    [string]$HostIp = "109.122.56.126",
    [string]$User = "root",
    [int]$Port = 22,
    [int]$MaxAttempts = 5,
    [string]$Command = ""
)

$key = Join-Path $env:USERPROFILE ".ssh\vibe_vps_deploy"
$expected = "SHA256:l0hpirMy/wrm0gRH4SNxl4PdMmpzKXtSFOjfMESvX7I"
$legacyWrongIp = "31.42.125.219"
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
    if ($fp -eq $wrong -or $HostIp -eq $legacyWrongIp) {
        Write-Host "Attempt $i/$MaxAttempts - legacy shared IP / wrong host, retrying..."
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
    $keyLine = [regex]::Match($probe, "\[109\.122\.56\.126\]:22 ssh-ed25519 (\S+)|109\.122\.56\.126 ssh-ed25519 (\S+)")
    if (-not $keyLine.Success) {
        $pubKey = [regex]::Match($probe, "Server host key: ssh-ed25519 (\S+)")
        if ($pubKey.Success -and -not (Select-String -Path $knownHosts -Pattern $HostIp -Quiet -ErrorAction SilentlyContinue)) {
            # Same VPS key as legacy IP — seed known_hosts on first dedicated-IP connect
            "109.122.56.126 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPPDToQyrJuGRBKBCHf1welkvWPTOai7uinUxHDBb3Mt" | Add-Content -Path $knownHosts
        }
    }
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
Write-Host "Could not reach VPS at $HostIp. Check CloudOnFire panel or docs/ops/dedicated-ip-migration.md."
exit 1

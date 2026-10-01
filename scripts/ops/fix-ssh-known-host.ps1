# Remove stale SSH host key for the VPS IP (fixes REMOTE HOST IDENTIFICATION HAS CHANGED).
# Usage: powershell -ExecutionPolicy Bypass -File scripts\ops\fix-ssh-known-host.ps1

param([string]$HostIp = "109.122.56.126")

Write-Host "Removing old host key for $HostIp ..."
ssh-keygen -R $HostIp
Write-Host ""
Write-Host "Done. Your VPS fingerprint should be:"
Write-Host "  SHA256:l0hpirMy/wrm0gRH4SNxl4PdMmpzKXtSFOjfMESvX7I"
Write-Host ""
Write-Host "Connect with:"
Write-Host "  ssh vibe-vps"
Write-Host "  (or if IP conflict: powershell -ExecutionPolicy Bypass -File scripts\ops\ssh-vps.ps1)"
Write-Host ""
Write-Host "Do NOT use: ssh root@109.122.56.126 (password login will fail or hit wrong host)."

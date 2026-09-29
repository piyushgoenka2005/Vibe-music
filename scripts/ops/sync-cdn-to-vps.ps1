# Sync locally staged CDN files to the VPS static root.
# Usage (PowerShell, from project root):
#   .\scripts\ops\sync-cdn-to-vps.ps1
#   $env:VPS_HOST = "root@31.42.125.219"; .\scripts\ops\sync-cdn-to-vps.ps1
param(
  [string]$Source = (Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) ".data\cdn"),
  [string]$Target = "/var/www/cdn",
  [string]$VpsHost = $(if ($env:VPS_HOST) { $env:VPS_HOST } else { "root@31.42.125.219" })
)

$Source = (Resolve-Path $Source -ErrorAction Stop).Path
$productsPath = Join-Path $Source "products"

if (-not (Test-Path $productsPath)) {
  Write-Error "Missing staged CDN files at $productsPath. Run first:`n  npm run generate:cdn-derivatives`n  (after staging masters in .data/cdn/products)"
}

Write-Host "Creating remote directory $VpsHost`:$Target/products ..."
ssh $VpsHost "mkdir -p '$Target/products'"

Write-Host "Syncing $Source -> $VpsHost`:$Target ..."
scp -r "$Source/products" "${VpsHost}:${Target}/"

Write-Host "Done. Verify on server:"
Write-Host "  ssh $VpsHost `"find $Target/products -type f | wc -l`""

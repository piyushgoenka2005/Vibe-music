# Sync locally staged CDN files to the VPS static root.
# Usage (PowerShell, from project root):
#   .\scripts\sync-cdn-to-vps.ps1
#   $env:VPS_HOST = "root@87.232.72.14"; .\scripts\sync-cdn-to-vps.ps1
param(
  [string]$Source = (Join-Path (Split-Path $PSScriptRoot -Parent) ".data\cdn"),
  [string]$Target = "/var/www/cdn",
  [string]$VpsHost = $(if ($env:VPS_HOST) { $env:VPS_HOST } else { "root@87.232.72.14" })
)

$Source = (Resolve-Path $Source -ErrorAction Stop).Path
$productsPath = Join-Path $Source "products"

if (-not (Test-Path $productsPath)) {
  Write-Error "Missing staged CDN files at $productsPath. Run upload first:`n  `$env:CDN_STORAGE_ROOT='.data/cdn'; npm run upload:product-images-cdn -- --upload --apply-catalog"
}

Write-Host "Creating remote directory $VpsHost`:$Target/products ..."
ssh $VpsHost "mkdir -p '$Target/products'"

Write-Host "Syncing $Source -> $VpsHost`:$Target ..."
scp -r "$Source/products" "${VpsHost}:${Target}/"

Write-Host "Done. Verify on server:"
Write-Host "  ssh $VpsHost `"find $Target/products -type f | wc -l`""

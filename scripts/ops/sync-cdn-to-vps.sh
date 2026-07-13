#!/usr/bin/env bash
# Sync locally staged CDN files to the VPS static root.
# Usage (from project root on your PC, after upload migration):
#   bash scripts/ops/sync-cdn-to-vps.sh
#   VPS_HOST=root@87.232.72.14 bash scripts/ops/sync-cdn-to-vps.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SOURCE="${CDN_SOURCE:-$ROOT/.data/cdn}"
TARGET="${CDN_TARGET:-/var/www/cdn}"
VPS_HOST="${VPS_HOST:-root@87.232.72.14}"

if [[ ! -d "$SOURCE/products" ]]; then
  echo "Missing staged CDN files at $SOURCE/products"
  echo "Run first: CDN_STORAGE_ROOT=.data/cdn npm run upload:product-images-cdn -- --upload"
  exit 1
fi

echo "Syncing $SOURCE -> $VPS_HOST:$TARGET"
ssh "$VPS_HOST" "mkdir -p '$TARGET'"
rsync -avz --progress "$SOURCE/" "$VPS_HOST:$TARGET/"
echo "Done. Verify: curl -I https://cdn.vibemusic.in/products/"

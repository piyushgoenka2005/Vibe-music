#!/usr/bin/env bash
# Quick production update on the VPS.
# Usage (as root):  cd ~/Vibe-music && bash deploy/update.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

echo "==> Pulling latest main"
git fetch origin main
git pull --ff-only origin main

echo "==> Installing dependencies"
npm ci

echo "==> Type-check"
npm run type-check

echo "==> Building"
export NODE_ENV=production
npm run build

echo "==> Restarting PM2"
if pm2 describe vibe >/dev/null 2>&1; then
  pm2 restart vibe --update-env
else
  pm2 start deploy/ecosystem.config.cjs --update-env
fi
pm2 save

echo "==> Health check"
sleep 3
curl -sS -o /dev/null -w "localhost:3000 → HTTP %{http_code}\n" http://127.0.0.1:3000/ || true
curl -sS -o /dev/null -w "api/health → HTTP %{http_code}\n" http://127.0.0.1:3000/api/health || true

echo "Update complete."

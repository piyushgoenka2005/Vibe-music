#!/usr/bin/env bash
# Production update on the VPS.
# Usage: cd ~/Vibe-music && bash deploy/update.sh
# Optional: SEED_CATALOG=1 bash deploy/update.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

echo "==> Pulling latest main"
git fetch origin main
git pull --ff-only origin main

echo "==> Installing dependencies"
npm ci

echo "==> Database migrations"
npm run db:migrate

if [[ "${SEED_CATALOG:-0}" == "1" ]]; then
  echo "==> Seeding catalog from JSON"
  npm run seed:catalog
fi

echo "==> Clearing stale Next.js build cache"
rm -rf .next

echo "==> Type-check"
npm run type-check

echo "==> Building"
export NODE_ENV=production
export ALLOW_POSTGRES_DURING_BUILD="${ALLOW_POSTGRES_DURING_BUILD:-true}"
npm run build

echo "==> Gear story videos (optional)"
npm run verify:gear-videos || true

echo "==> Ensuring PM2 log directory"
mkdir -p /var/log/vibe

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
if [[ "${SEED_CATALOG:-0}" != "1" ]]; then
  echo "Tip: run SEED_CATALOG=1 bash deploy/update.sh after catalog JSON changes."
fi

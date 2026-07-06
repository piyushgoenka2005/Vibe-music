#!/usr/bin/env bash
# Safe production redeploy for Vibe Music. Run on VPS after git pull.
#   export APP_DIR=/path/to/vibe-music
#   bash deploy/production-fix.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
cd "$APP_DIR"

echo "==> App directory: $APP_DIR"
mkdir -p /var/log/vibe

if [ ! -f .env.production ] && [ ! -f .env.local ] && [ ! -f .env ]; then
  echo "ERROR: No .env.production, .env.local, or .env found. Create one before deploying."
  exit 1
fi

echo "==> Backing up PM2 state"
pm2 save 2>/dev/null || true
cp -a ~/.pm2/dump.pm2 ~/.pm2/dump.pm2.bak.$(date +%s) 2>/dev/null || true

if [ -f /etc/nginx/sites-available/vibemusic.in ]; then
  cp -a /etc/nginx/sites-available/vibemusic.in "/etc/nginx/sites-available/vibemusic.in.bak.$(date +%s)"
fi

echo "==> Installing dependencies (full install for build)"
npm ci

echo "==> Building Next.js"
export NODE_ENV=production
npm run build

echo "==> Restarting PM2"
if pm2 describe vibe >/dev/null 2>&1; then
  pm2 restart vibe --update-env
else
  pm2 start deploy/ecosystem.config.cjs
fi
pm2 save

echo "==> Enabling PM2 on boot"
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash || true

echo "==> Reloading Nginx"
nginx -t
systemctl reload nginx

sleep 3
echo "==> Health check"
curl -sS -o /dev/null -w "Homepage: HTTP %{http_code}\n" http://127.0.0.1:3000/
curl -sS http://127.0.0.1:3000/api/health | head -c 500 || true
echo ""
pm2 list

echo "Done. Test https://vibemusic.in in your browser."

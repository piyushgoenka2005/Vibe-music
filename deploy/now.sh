#!/usr/bin/env bash
# One-paste production deploy on the VPS (pull latest main + rebuild + restart).
# Usage (Serial Console or SSH as root):
#   curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/now.sh | bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/Vibe-music}"
REPO_URL="https://github.com/piyushgoenka2005/Vibe-music.git"

echo "==> Authorize GitHub deploy SSH key"
curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/install-deploy-key.sh | bash

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "==> Clone repository"
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch origin main
git checkout main 2>/dev/null || git checkout -b main
git pull --ff-only origin main

if grep -q '^NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH=' .env 2>/dev/null; then
  sed -i 's/^NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH=.*/NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH=false/' .env
else
  echo 'NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH=false' >> .env
fi

echo "==> Deploy $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"
bash deploy/update.sh

echo ""
echo "==> Local health"
curl -s http://127.0.0.1:3000/api/health || true
echo ""
pm2 status || true
echo ""
echo "DONE. Ensure DNS for vibemusic.in points to: $(curl -fsSL -4 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"

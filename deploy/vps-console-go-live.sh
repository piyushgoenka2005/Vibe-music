#!/usr/bin/env bash
# ONE PASTE in CloudOnFire VPS web console (root) — Phases 8–10 bootstrap.
#
#   curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/vps-console-go-live.sh | bash
#
# Optional env (non-interactive):
#   NEXT_PUBLIC_GSTIN=19XXXXXXXXXXXXX NEXT_PUBLIC_LEGAL_ENTITY_NAME="Entity" bash vps-console-go-live.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/Vibe-music}"
REPO_URL="${REPO_URL:-https://github.com/piyushgoenka2005/Vibe-music.git}"

echo "═══════════════════════════════════════════════════════════"
echo "  Vibe Music — VPS console go-live (Phases 8–10)"
echo "═══════════════════════════════════════════════════════════"

echo "▶ Install GitHub Actions deploy SSH key"
bash "$(dirname "$0")/install-deploy-key.sh" 2>/dev/null || {
  curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/install-deploy-key.sh | bash
}

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "▶ Clone repository"
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"
git fetch origin main
git checkout main 2>/dev/null || git checkout -b main
git pull --ff-only origin main

if [[ ! -f deploy/ops-secrets.env ]]; then
  cp deploy/ops-secrets.env.example deploy/ops-secrets.env
fi

echo "▶ Full production go-live (compliance + deploy + edge)"
bash deploy/production-100.sh

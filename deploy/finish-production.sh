#!/usr/bin/env bash
# Single production finish command — run ON the VPS after code is on origin/main.
# Usage:
#   cd /path/to/Vibe-music && bash deploy/finish-production.sh
#
# Optional:
#   SEED_CATALOG=1 bash deploy/finish-production.sh
#   SKIP_OPS_SECRETS=1 bash deploy/finish-production.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Vibe Music — Finish production (100% live parity)"
echo "  APP_DIR=$APP_DIR"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "▶ 1/6 — Pull origin/main"
git fetch origin main
git pull --ff-only origin main
echo "   Commit: $(git log -1 --oneline)"
echo ""

if [[ "${SKIP_OPS_SECRETS:-0}" != "1" && -f deploy/ops-secrets.env ]]; then
  echo "▶ 2/6 — Merge ops-secrets.env → .env"
  node scripts/ops/merge-ops-secrets.mjs || true
else
  echo "▶ 2/6 — Skip ops-secrets merge (none or SKIP_OPS_SECRETS=1)"
fi
echo ""

echo "▶ 3/6 — Env check"
npm run check:env || true
echo ""

echo "▶ 4/6 — Deploy (ci → migrate → build → PM2 → smoke)"
SKIP_PULL=1 bash deploy/update.sh
echo ""

echo "▶ 5/6 — Ops cron (backups + reservation sweeper)"
bash deploy/install-backups.sh || echo "   ⚠️ backups installer failed (non-fatal)"
bash deploy/install-reservation-sweeper.sh || echo "   ⚠️ sweeper installer failed (non-fatal)"
echo ""

echo "▶ 6/6 — Public smoke"
BASE_URL="${PUBLIC_BASE_URL:-https://vibemusic.in}" bash deploy/post-deploy-smoke.sh

echo ""
echo "✅ finish-production complete."
echo "   If GSC token not set yet: add NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to .env,"
echo "   then rebuild (SKIP_PULL=1 bash deploy/update.sh) and verify in Search Console."
echo "   Runbook: docs/ops/DEPLOY_READY.md"
echo ""

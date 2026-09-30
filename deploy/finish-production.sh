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

echo "▶ 1/7 — Pull origin/main"
git fetch origin main
git pull --ff-only origin main
echo "   Commit: $(git log -1 --oneline)"
echo ""

echo "▶ 2/7 — Normalize + merge env"
node scripts/ops/normalize-production-env.mjs || true
if [[ "${SKIP_OPS_SECRETS:-0}" != "1" && -f deploy/ops-secrets.env ]]; then
  node scripts/ops/merge-ops-secrets.mjs || true
else
  echo "   (no deploy/ops-secrets.env — skipped merge)"
fi
echo ""

echo "▶ 3/7 — Env check"
npm run check:env || true
echo ""

echo "▶ 4/7 — Deploy (ci → migrate → build → PM2 → smoke)"
SKIP_PULL=1 bash deploy/update.sh
echo ""

echo "▶ 5/7 — Ops cron (backups + reservation sweeper)"
bash deploy/install-backups.sh || echo "   ⚠️ backups installer failed (non-fatal)"
bash deploy/install-reservation-sweeper.sh || echo "   ⚠️ sweeper installer failed (non-fatal)"
echo ""

echo "▶ 6/7 — Smoke (loopback APIs + public pages)"
API_BASE_URL="http://127.0.0.1:3000" BASE_URL="http://127.0.0.1:3000" bash deploy/post-deploy-smoke.sh
if [[ "${SKIP_PUBLIC_SMOKE:-0}" != "1" ]]; then
  API_BASE_URL="http://127.0.0.1:3000" BASE_URL="${PUBLIC_BASE_URL:-https://vibemusic.in}" \
    bash deploy/post-deploy-smoke.sh || echo "   ⚠️ public smoke had failures (API still checked via loopback)"
fi
echo ""

echo "▶ 7/7 — Configuration status report"
npm run ops:configuration-status || echo "   ⚠️ configuration-status reported gaps (see above)"
echo ""

echo ""
echo "✅ finish-production complete."
echo "   If GSC token not set yet: add NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to .env,"
echo "   then rebuild (SKIP_PULL=1 bash deploy/update.sh) and verify in Search Console."
echo "   Runbook: README.md"
echo ""

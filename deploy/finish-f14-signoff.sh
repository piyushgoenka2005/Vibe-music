#!/usr/bin/env bash
# One-shot F-14 production close-out on the VPS.
# Run after SSH:
#   ssh root@87.232.72.14
#   bash ~/Vibe-music/deploy/finish-f14-signoff.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

echo "═══════════════════════════════════════════════════════════"
echo "  Vibe Music — F-14 production sign-off"
echo "═══════════════════════════════════════════════════════════"
echo

echo "▶ Pull main"
git fetch origin main
git checkout main
git pull --ff-only origin main
echo "   $(git log -1 --oneline)"
echo

echo "▶ Deploy (migrate/build/restart)"
bash deploy/update.sh
echo

echo "▶ Install backups + cron"
bash deploy/install-backups.sh
echo

echo "▶ Razorpay ops (no charge)"
npx tsx --env-file=.env scripts/ops/verify-razorpay-ops.mts
echo

echo "▶ Public prod smoke"
VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}" \
  npx tsx scripts/ops/prod-signoff.mts
echo

echo "✅ F-14 automation finished."
echo "   If paid_orders_db was WARN: place one live Razorpay order, then re-run:"
echo "   npx tsx --env-file=.env scripts/ops/verify-razorpay-ops.mts"
echo

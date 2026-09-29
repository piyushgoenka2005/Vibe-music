#!/usr/bin/env bash
# End-to-end production go-live — run ON THE VPS as root.
#
#   cd ~/Vibe-music && git pull origin main && bash deploy/go-live-e2e.sh
#
# Non-interactive (set your real 15-char GSTIN):
#   NEXT_PUBLIC_GSTIN=19XXXXXXXXXXXXX bash deploy/go-live-e2e.sh
#
# Optional UFW lockdown:
#   LOCKDOWN_UFW=1 bash deploy/go-live-e2e.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"
BASE="${VERIFY_BASE_URL:-https://vibemusic.in}"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Vibe Music — end-to-end production go-live"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "▶ 1/6 — Ensure ops secrets (metrics token, legal entity)"
bash deploy/ensure-ops-secrets.sh
node scripts/ops/merge-ops-secrets.mjs || true
echo ""

echo "▶ 2/6 — Deploy latest (preflight → build → PM2 → smoke)"
bash deploy/finish-production.sh
echo ""

echo "▶ 3/6 — L-30 compliance (GSTIN + legal entity + redeploy)"
bash deploy/apply-compliance.sh
echo ""

echo "▶ 4/6 — GitHub Actions deploy key (optional, idempotent)"
bash deploy/install-deploy-key.sh 2>/dev/null || {
  echo "   ⚠️  install-deploy-key skipped — add key manually for CI deploys"
}
echo ""

echo "▶ 5/6 — Edge security (L-22 / L-23)"
if [[ "${LOCKDOWN_UFW:-0}" == "1" ]]; then
  sudo LOCKDOWN_UFW=1 bash deploy/complete-audit-go-live.sh
else
  bash deploy/complete-audit-go-live.sh || {
    echo ""
    echo "   ℹ Edge checks failed — verify DNS + nginx per docs/ops/CLOUDONFIRE-SETUP.md"
    echo "   Optional: LOCKDOWN_UFW=1 bash deploy/go-live-e2e.sh"
  }
fi
echo ""

echo "▶ 6/6 — Production verification"
VERIFY_BASE_URL="$BASE" npm run verify:prod-signoff || true
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL="$BASE" npm run verify:prod-signoff || true
VERIFY_BASE_URL="$BASE" npm run verify:production-20 || true

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Go-live complete — check verify:production-20 above."
echo "  Target 20/20: GSTIN live + CloudOnFire DNS + nginx edge."
echo "═══════════════════════════════════════════════════════════"

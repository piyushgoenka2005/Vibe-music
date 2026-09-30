#!/usr/bin/env bash
# One-shot path to 10/10 live certification (run on VPS as root).
#
# Prerequisites:
#   - deploy/ops-secrets.env with NEXT_PUBLIC_GSTIN, legal name, phone, GA4
#   - DNS pointing to CloudOnFire VPS (see README.md)
#
# Usage:
#   cd ~/Vibe-music && bash deploy/certify-production.sh
#
# With UFW lockdown:
#   LOCKDOWN_UFW=1 bash deploy/certify-production.sh
#
# Non-interactive GSTIN:
#   NEXT_PUBLIC_GSTIN=19XXXXXXXXXXXXX NEXT_PUBLIC_LEGAL_ENTITY_NAME="Entity" bash deploy/certify-production.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Vibe Music — Production certification (target 20/20)"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "▶ Phase 1 — Ops secrets + finish production"
bash deploy/ensure-ops-secrets.sh
bash deploy/finish-production.sh
echo ""

echo "▶ Phase 2 — L-30 compliance (GSTIN + legal entity)"
bash deploy/apply-compliance.sh
echo ""

echo "▶ Phase 3 — Audit go-live (nginx edge + optional UFW)"
if [[ "${LOCKDOWN_UFW:-0}" = "1" ]]; then
  sudo LOCKDOWN_UFW=1 bash deploy/complete-audit-go-live.sh
else
  bash deploy/complete-audit-go-live.sh || {
    echo ""
    echo "   ℹ Re-run with UFW lockdown:"
    echo "   LOCKDOWN_UFW=1 bash deploy/certify-production.sh"
    exit 1
  }
fi

echo ""
echo "▶ Phase 4 — Strict compliance sign-off"
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}" npm run verify:prod-signoff

echo ""
echo "▶ Phase 5 — Readiness scorecard"
npm run verify:readiness || true

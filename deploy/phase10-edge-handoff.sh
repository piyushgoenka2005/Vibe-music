#!/usr/bin/env bash
# Phase 10 — production edge handoff (CloudOnFire VPS + nginx).
#
# Usage:
#   VERIFY_BASE_URL=https://vibemusic.in bash deploy/phase10-edge-handoff.sh
# Optional UFW lockdown:
#   LOCKDOWN_UFW=1 VERIFY_BASE_URL=https://vibemusic.in bash deploy/phase10-edge-handoff.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"
BASE="${VERIFY_BASE_URL:-https://vibemusic.in}"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Phase 10 — Edge security (L-22 / L-23) — CloudOnFire"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "▶ L-22 production edge check"
if VERIFY_BASE_URL="$BASE" npm run check:edge; then
  echo "   ✅ nginx TLS + security headers OK"
  echo ""
  echo "▶ L-23 origin firewall"
  if [[ "${LOCKDOWN_UFW:-0}" == "1" ]]; then
    sudo bash deploy/vps-firewall.sh
  else
    echo "   Run on VPS: sudo bash deploy/vps-firewall.sh"
  fi
else
  echo ""
  echo "   ⚠️  L-22 not complete — follow README.md:"
  echo "   1. DNS A records → CloudOnFire VPS IP"
  echo "   2. bash deploy/update.sh"
  echo "   3. Re-run this script"
  exit 1
fi

echo ""
echo "▶ Strict production sign-off"
REQUIRE_CDN_EDGE=true VERIFY_BASE_URL="$BASE" npm run verify:prod-signoff

echo ""
echo "Phase 10 complete when check:edge + sign-off pass."

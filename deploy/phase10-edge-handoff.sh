#!/usr/bin/env bash
# Phase 10 — L-22 / L-23 edge security handoff (run after Cloudflare DNS is proxied).
#
# Usage:
#   VERIFY_BASE_URL=https://vibemusic.in bash deploy/phase10-edge-handoff.sh
# After cf-ray is present:
#   sudo CLOUDFLARE_ONLY=1 bash deploy/complete-audit-go-live.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"
BASE="${VERIFY_BASE_URL:-https://vibemusic.in}"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Phase 10 — Edge security (L-22 / L-23)"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "▶ L-22 edge check"
if VERIFY_BASE_URL="$BASE" npm run check:edge; then
  echo "   ✅ CDN/WAF edge detected"
  echo ""
  echo "▶ L-23 origin lockdown"
  if [[ "${CLOUDFLARE_ONLY:-0}" == "1" ]]; then
    sudo bash deploy/cloudflare-ufw.sh
  else
    echo "   Run on VPS: sudo CLOUDFLARE_ONLY=1 bash deploy/complete-audit-go-live.sh"
  fi
else
  echo ""
  echo "   ⚠️  L-22 not complete — follow deploy/cloudflare/README.md:"
  echo "   1. Add vibemusic.in to Cloudflare (orange-cloud DNS)"
  echo "   2. SSL/TLS → Full (strict)"
  echo "   3. Re-run this script until cf-ray appears"
  exit 1
fi

echo ""
echo "▶ Strict production sign-off"
REQUIRE_CDN_EDGE=true VERIFY_BASE_URL="$BASE" npm run verify:prod-signoff

echo ""
echo "Phase 10 complete when check:edge + REQUIRE_CDN_EDGE sign-off pass."

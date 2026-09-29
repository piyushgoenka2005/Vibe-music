#!/usr/bin/env bash
# Phase 10 — verify production edge on CloudOnFire VPS (nginx TLS + security headers).
#
# Usage:
#   VERIFY_BASE_URL=https://vibemusic.in bash deploy/verify-edge-security.sh
#   REQUIRE_PRODUCTION_EDGE=true bash deploy/verify-edge-security.sh
set -euo pipefail

VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}"
REQUIRE_PRODUCTION_EDGE="${REQUIRE_PRODUCTION_EDGE:-${REQUIRE_CDN_EDGE:-false}}"

echo "Phase 10 edge security — ${VERIFY_BASE_URL}"

if ! VERIFY_BASE_URL="$VERIFY_BASE_URL" npm run check:edge; then
  echo "" >&2
  echo "L-22 FAIL — production edge checks failed." >&2
  echo "  1. Point DNS A records (@, www, cdn) to the CloudOnFire VPS IP" >&2
  echo "  2. Run: bash deploy/update.sh  (syncs nginx + CDN site)" >&2
  echo "  3. Re-run this script" >&2
  echo "  Guide: docs/ops/CLOUDONFIRE-SETUP.md" >&2
  exit 1
fi

echo "L-22 PASS — nginx TLS + security headers OK."

if [[ "${PROBE_UFW:-0}" == "1" ]] && command -v ufw >/dev/null 2>&1; then
  if ufw status 2>/dev/null | grep -qE 'Status: active'; then
    if ufw status 2>/dev/null | grep -qiE 'nginx|80|443'; then
      echo "L-23 PASS — UFW active with nginx HTTP/HTTPS rules."
    else
      echo "L-23 WARN — UFW active but nginx rules not detected." >&2
      echo "  Run: sudo bash deploy/vps-firewall.sh" >&2
      [[ "$REQUIRE_PRODUCTION_EDGE" == "true" ]] && exit 1
    fi
  else
    echo "L-23 WARN — UFW not active." >&2
    echo "  Run: sudo bash deploy/vps-firewall.sh" >&2
    [[ "$REQUIRE_PRODUCTION_EDGE" == "true" ]] && exit 1
  fi
fi

if [[ "$REQUIRE_PRODUCTION_EDGE" == "true" ]]; then
  REQUIRE_CDN_EDGE=true VERIFY_BASE_URL="$VERIFY_BASE_URL" npm run verify:prod-signoff
fi

echo "Phase 10 edge checks passed."

#!/usr/bin/env bash
# Phase 10 — verify L-22 CDN/WAF edge (and optional L-23 UFW on VPS).
#
# Usage:
#   VERIFY_BASE_URL=https://vibemusic.in bash deploy/verify-edge-security.sh
#   REQUIRE_CDN_EDGE=true bash deploy/verify-edge-security.sh
set -euo pipefail

VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}"
REQUIRE_CDN_EDGE="${REQUIRE_CDN_EDGE:-false}"

echo "Phase 10 edge security — ${VERIFY_BASE_URL}"

if ! VERIFY_BASE_URL="$VERIFY_BASE_URL" npm run check:edge; then
  echo "" >&2
  echo "L-22 FAIL — no CDN/WAF marker (cf-ray)." >&2
  echo "  1. Add vibemusic.in to Cloudflare (orange-cloud DNS)" >&2
  echo "  2. SSL/TLS → Full (strict)" >&2
  echo "  3. Re-run this script" >&2
  echo "  Guide: deploy/cloudflare/README.md" >&2
  exit 1
fi

echo "L-22 PASS — CDN/WAF edge detected."

if [[ "${PROBE_UFW:-0}" == "1" ]] && command -v ufw >/dev/null 2>&1; then
  if ufw status 2>/dev/null | grep -qE 'Status: active'; then
    if ufw status 2>/dev/null | grep -qE '103\.21\.|104\.16\.|172\.64\.|141\.101\.'; then
      echo "L-23 PASS — UFW active with Cloudflare IP rules."
    else
      echo "L-23 WARN — UFW active but Cloudflare CIDR rules not detected." >&2
      echo "  Run: sudo CLOUDFLARE_ONLY=1 bash deploy/cloudflare-ufw.sh" >&2
      [[ "$REQUIRE_CDN_EDGE" == "true" ]] && exit 1
    fi
  else
    echo "L-23 WARN — UFW not active." >&2
    echo "  After L-22: sudo CLOUDFLARE_ONLY=1 bash deploy/complete-audit-go-live.sh" >&2
    [[ "$REQUIRE_CDN_EDGE" == "true" ]] && exit 1
  fi
fi

if [[ "$REQUIRE_CDN_EDGE" == "true" ]]; then
  REQUIRE_CDN_EDGE=true VERIFY_BASE_URL="$VERIFY_BASE_URL" npm run verify:prod-signoff
fi

echo "Phase 10 edge checks passed."

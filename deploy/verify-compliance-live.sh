#!/usr/bin/env bash
# Phase 9 — verify L-30 compliance (GSTIN + legal entity in live homepage HTML).
#
# Usage:
#   VERIFY_BASE_URL=https://vibemusic.in bash deploy/verify-compliance-live.sh
#   REQUIRE_COMPLIANCE=true bash deploy/verify-compliance-live.sh
set -euo pipefail

VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}"
VERIFY_BASE_URL="${VERIFY_BASE_URL%/}"
REQUIRE_COMPLIANCE="${REQUIRE_COMPLIANCE:-false}"

echo "L-30 compliance check — ${VERIFY_BASE_URL}"

HTML="$(curl -fsS --max-time 30 "${VERIFY_BASE_URL}/" || echo "")"
if [[ -z "$HTML" ]]; then
  echo "FAIL — could not fetch homepage" >&2
  exit 1
fi

GSTIN="$(echo "$HTML" | grep -oE 'GSTIN:\s*[0-9A-Z]{15}' | head -1 | grep -oE '[0-9A-Z]{15}$' || true)"
LEGAL_OK=0
if echo "$HTML" | grep -qE 'Sikkim Commerce House|Vibe Music'; then
  LEGAL_OK=1
fi

echo "  legal entity in HTML: $([[ "$LEGAL_OK" -eq 1 ]] && echo yes || echo no)"
echo "  GSTIN in HTML: ${GSTIN:-missing}"

if [[ -n "$GSTIN" ]] && [[ "$LEGAL_OK" -eq 1 ]]; then
  echo "PASS — L-30 compliance visible on homepage."
  exit 0
fi

if [[ "$REQUIRE_COMPLIANCE" == "true" ]]; then
  echo "FAIL — L-30 compliance not satisfied (REQUIRE_COMPLIANCE=true)." >&2
else
  echo "WARN — L-30 not live yet (set GSTIN on VPS)." >&2
fi

echo "" >&2
echo "Operator fix (VPS):" >&2
echo "  cd ~/Vibe-music && bash deploy/apply-compliance.sh" >&2
echo "  # or: NEXT_PUBLIC_GSTIN=19XXXXXXXXXXXXX NEXT_PUBLIC_LEGAL_ENTITY_NAME=\"Entity\" bash deploy/apply-compliance.sh" >&2
exit 1

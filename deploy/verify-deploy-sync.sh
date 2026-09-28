#!/usr/bin/env bash
# Compare live /api/health version with expected git SHA (Phase 8 deploy sync).
#
# Usage:
#   EXPECTED_SHA=$(git rev-parse HEAD) bash deploy/verify-deploy-sync.sh
#   EXPECTED_SHA=abc123 VERIFY_BASE_URL=https://vibemusic.in bash deploy/verify-deploy-sync.sh
set -euo pipefail

VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}"
VERIFY_BASE_URL="${VERIFY_BASE_URL%/}"
EXPECTED_SHA="${EXPECTED_SHA:-}"

if [[ -z "$EXPECTED_SHA" ]]; then
  if git rev-parse HEAD >/dev/null 2>&1; then
    EXPECTED_SHA="$(git rev-parse HEAD)"
  else
    echo "ERROR: set EXPECTED_SHA or run from a git checkout." >&2
    exit 1
  fi
fi

EXPECTED_SHORT="${EXPECTED_SHA:0:7}"
HEALTH_URL="${VERIFY_BASE_URL}/api/health"

echo "Deploy sync check"
echo "  expected: ${EXPECTED_SHORT} (${EXPECTED_SHA})"
echo "  live:     ${HEALTH_URL}"

BODY="$(curl -fsS --max-time 30 "${HEALTH_URL}" || echo "")"
if [[ -z "$BODY" ]]; then
  echo "FAIL — could not reach ${HEALTH_URL}" >&2
  exit 1
fi

LIVE_VERSION="$(echo "$BODY" | node -e "
  let d;
  try { d = JSON.parse(require('fs').readFileSync(0,'utf8')); }
  catch { process.exit(2); }
  process.stdout.write(String(d.version ?? '').trim());
" 2>/dev/null || true)"

if [[ -z "$LIVE_VERSION" ]]; then
  echo "FAIL — /api/health did not return version" >&2
  exit 1
fi

echo "  reported: ${LIVE_VERSION}"

if [[ "$LIVE_VERSION" == "$EXPECTED_SHA" ]] || [[ "$LIVE_VERSION" == "$EXPECTED_SHORT" ]] || [[ "$EXPECTED_SHA" == "$LIVE_VERSION"* ]]; then
  echo "PASS — live version matches expected commit."
  exit 0
fi

echo "FAIL — live is behind or mismatched (expected ${EXPECTED_SHORT}, got ${LIVE_VERSION})." >&2
echo "" >&2
echo "Operator fix (VPS console as root):" >&2
echo "  curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/vps-console-go-live.sh | bash" >&2
echo "" >&2
echo "Or restore GitHub Actions SSH:" >&2
echo "  curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/install-deploy-key.sh | bash" >&2
exit 1

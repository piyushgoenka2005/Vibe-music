#!/usr/bin/env bash
# Post-deploy smoke checks (localhost or public URL).
# Usage:
#   bash deploy/post-deploy-smoke.sh
#   BASE_URL=https://vibemusic.in bash deploy/post-deploy-smoke.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
BASE_URL="${BASE_URL%/}"
STRICT="${STRICT:-1}"
FAILS=0

pass() { echo "  ✅ $1"; }
fail() {
  echo "  ❌ $1"
  FAILS=$((FAILS + 1))
}

check_http() {
  local path="$1"
  local expect="${2:-200}"
  local label="${3:-$path}"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 20 "${BASE_URL}${path}" || echo "000")
  if [[ "$code" == "$expect" ]]; then
    pass "$label → HTTP $code"
  else
    fail "$label → HTTP $code (expected $expect)"
  fi
}

# Assert JSON with Node (available wherever the app runs).
# $1 = path, $2 = JS expression using `d`, $3 = label
check_json() {
  local path="$1"
  local expr="$2"
  local label="$3"
  local body
  body=$(curl -sS --max-time 20 "${BASE_URL}${path}" || echo "")
  if echo "$body" | node -e "
    let d;
    try { d = JSON.parse(require('fs').readFileSync(0,'utf8')); }
    catch { process.exit(2); }
    const ok = Boolean($expr);
    process.exit(ok ? 0 : 1);
  " 2>/dev/null; then
    pass "$label"
  else
    fail "$label (body: $(echo "$body" | head -c 160))"
  fi
}

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Vibe Music — post-deploy smoke"
echo "  BASE_URL=$BASE_URL"
echo "═══════════════════════════════════════════════════════════"
echo ""

check_http "/" "200" "GET /"
check_http "/api/health" "200" "GET /api/health"
check_json "/api/health" "(d.status === 'healthy' || d.status === 'degraded') && d.checks && d.checks.database === 'ok'" "health: database ok"

check_http "/api/coupons/active" "200" "GET /api/coupons/active"
check_json "/api/coupons/active" "Array.isArray(d.coupons)" "coupons/active returns {coupons:[]}"

check_http "/api/checkout/capabilities" "200" "GET /api/checkout/capabilities"
check_json "/api/checkout/capabilities" "d.razorpayConfigured === true || d.onlinePaymentsAvailable === true" "checkout: Razorpay available"

check_http "/api/banners" "200" "GET /api/banners"
check_http "/robots.txt" "200" "GET /robots.txt"
check_http "/sitemap.xml" "200" "GET /sitemap.xml"
check_http "/api/admin/me" "401" "GET /api/admin/me (auth enforced)"

check_http "/giveaway" "200" "GET /giveaway"
check_http "/rentals" "200" "GET /rentals"
check_http "/blog" "200" "GET /blog"
check_http "/login" "200" "GET /login"

echo ""
if [[ "$FAILS" -eq 0 ]]; then
  echo "✅ Smoke PASS ($BASE_URL)"
  echo ""
  exit 0
fi

echo "❌ Smoke FAIL — $FAILS check(s) failed"
echo ""
if [[ "$STRICT" == "1" ]]; then
  exit 1
fi
exit 0

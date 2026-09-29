#!/usr/bin/env bash
# Post-deploy smoke checks (localhost or public URL).
# Usage:
#   bash deploy/post-deploy-smoke.sh
#   BASE_URL=https://vibemusic.in bash deploy/post-deploy-smoke.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
BASE_URL="${BASE_URL%/}"
# API routes: prefer loopback on VPS (avoids hairpin/timeouts via public URL).
API_BASE_URL="${API_BASE_URL:-$BASE_URL}"
API_BASE_URL="${API_BASE_URL%/}"
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
  local origin="${4:-$BASE_URL}"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 "${origin}${path}" || echo "000")
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
  local origin="${4:-$API_BASE_URL}"
  local body
  body=$(curl -sS --max-time 30 "${origin}${path}" || echo "")
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
echo "  API_BASE_URL=$API_BASE_URL"
echo "═══════════════════════════════════════════════════════════"
echo ""

check_http "/" "200" "GET /"

# Security headers (SEC-01)
sec_headers=$(curl -sS -I --max-time 30 "${BASE_URL}/" || echo "")
if echo "$sec_headers" | grep -qi "strict-transport-security:.*max-age=" && \
   echo "$sec_headers" | grep -qi "content-security-policy:.*default-src" && \
   echo "$sec_headers" | grep -qi "x-content-type-options: nosniff"; then
  pass "security headers (HSTS, CSP, nosniff)"
else
  fail "security headers missing or incomplete on GET /"
fi

check_http "/api/healthz" "200" "GET /api/healthz (liveness)" "$API_BASE_URL"
check_http "/api/readyz" "200" "GET /api/readyz (readiness)" "$API_BASE_URL"
check_http "/api/health" "200" "GET /api/health" "$API_BASE_URL"
check_json "/api/health" "(d.status === 'healthy' || d.status === 'degraded') && d.checks && d.checks.database === 'ok'" "health: database ok"
check_json "/api/readyz" "d.ready === true" "readyz: database reachable"

check_http "/api/coupons/active" "200" "GET /api/coupons/active" "$API_BASE_URL"
check_json "/api/coupons/active" "Array.isArray(d.coupons)" "coupons/active returns {coupons:[]}"

check_http "/api/checkout/capabilities" "200" "GET /api/checkout/capabilities" "$API_BASE_URL"
check_json "/api/checkout/capabilities" "d.razorpayConfigured === true && d.onlinePaymentsAvailable === true && d.demoPaymentsAllowed !== true && d.razorpayMode === 'live'" "checkout: live Razorpay configured (razorpayMode=live)"

check_json "/api/banners" "Array.isArray(d.banners)" "banners API returns {banners:[]}"

check_http "/api/products?limit=1" "200" "GET /api/products" "$API_BASE_URL"
check_json "/api/products?limit=1" "Array.isArray(d.products) && d.products.length > 0" "catalog has products"

check_http "/deals" "200" "GET /deals (SSR page)"

# Password reset must not 503 when SMTP + DB are configured (enumeration-safe 200).
check_json_post() {
  local path="$1"
  local expr="$2"
  local label="$3"
  local origin_hdr="${ORIGIN_URL:-https://vibemusic.in}"
  body=$(curl -sS --max-time 30 -X POST "${API_BASE_URL}${path}" \
    -H "Content-Type: application/json" \
    -H "Origin: ${origin_hdr}" \
    -d '{"email":"smoke-check@vibemusic.in"}' || echo "")
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

check_json_post "/api/auth/forgot-password" "d.ok === true" "POST /api/auth/forgot-password (SMTP+DB)"
check_http "/api/e2e/password-reset" "404" "GET /api/e2e/password-reset disabled in prod" "$API_BASE_URL"

check_http "/robots.txt" "200" "GET /robots.txt"
check_http "/sitemap.xml" "200" "GET /sitemap.xml"
check_http "/api/admin/me" "401" "GET /api/admin/me (auth enforced)" "$API_BASE_URL"
check_http "/api/admin/products/import/template?format=csv" "401" "GET bulk import template (auth enforced)" "$API_BASE_URL"
check_http "/api/admin/products/import/template?format=xlsx" "401" "GET bulk import template XLSX (auth enforced)" "$API_BASE_URL"

if [[ -f docs/templates/vibemusic-bulk.csv ]]; then
  bulk_header=$(head -1 docs/templates/vibemusic-bulk.csv)
  bulk_cols=$(echo "$bulk_header" | awk -F',' '{print NF}')
  if [[ "$bulk_cols" -ge 81 ]] && echo "$bulk_header" | grep -q 'image12'; then
    pass "bulk template CSV has ${bulk_cols} columns incl. image12"
  else
    fail "bulk template CSV columns=${bulk_cols} (expected >=81 with image12)"
  fi
else
  fail "docs/templates/vibemusic-bulk.csv missing from deploy tree"
fi

check_http "/giveaway" "200" "GET /giveaway"
check_http "/rentals" "200" "GET /rentals"
check_http "/blog" "200" "GET /blog"
check_http "/login" "200" "GET /login"

echo ""
echo "▶ Product images + CDN"
SAMPLE_IMAGE=$(curl -sS --max-time 30 "${API_BASE_URL}/api/products?limit=1" | node -e "
let d;
try { d = JSON.parse(require('fs').readFileSync(0, 'utf8')); } catch { process.exit(0); }
const img = d.products?.[0]?.image?.trim();
if (img) process.stdout.write(img);
" 2>/dev/null || true)

if [[ -z "$SAMPLE_IMAGE" ]]; then
  fail "sample product image URL missing from catalog"
else
  pass "sample product image URL present"
  img_code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 -L -I "$SAMPLE_IMAGE" 2>/dev/null || echo "000")
  if [[ "$img_code" == "200" || "$img_code" == "301" || "$img_code" == "302" ]]; then
    pass "public product image reachable (HTTP $img_code)"
  else
    fail "public product image HTTP $img_code → $SAMPLE_IMAGE"
  fi

  cdn_path=$(node -e "try { console.log(new URL(process.argv[1]).pathname); } catch {}" "$SAMPLE_IMAGE" 2>/dev/null || true)
  if [[ -n "$cdn_path" ]]; then
    local_cdn_code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 -H "Host: cdn.vibemusic.in" "http://127.0.0.1${cdn_path}" 2>/dev/null || echo "000")
    if [[ "$local_cdn_code" == "200" ]]; then
      pass "local nginx CDN static file (HTTP 200)"
    else
      fail "local nginx CDN static HTTP $local_cdn_code (check /var/www/cdn)"
    fi
  fi

  thumb_url="${API_BASE_URL}/api/media/thumb?url=$(node -p "encodeURIComponent(process.argv[1])" "$SAMPLE_IMAGE")&w=480"
  thumb_code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 -L "$thumb_url" 2>/dev/null || echo "000")
  if [[ "$thumb_code" == "200" || "$thumb_code" == "302" ]]; then
    pass "thumb proxy reachable (HTTP $thumb_code)"
  else
    fail "thumb proxy HTTP $thumb_code"
  fi
fi

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

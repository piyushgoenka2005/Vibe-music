#!/usr/bin/env bash
# Pre-deploy validation on the VPS — fail fast before migrate/build.
# Usage: bash deploy/preflight.sh
# Skipped when: SKIP_PREFLIGHT=1 bash deploy/update.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

FAILS=0
warn() { echo "  ⚠️  $1"; }
fail() { echo "  ❌ $1"; FAILS=$((FAILS + 1)); }
pass() { echo "  ✅ $1"; }

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Vibe Music — deploy preflight"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "▶ Toolchain"
for cmd in node npm git curl; do
  if command -v "$cmd" >/dev/null 2>&1; then
    pass "$cmd available"
  else
    fail "$cmd not found"
  fi
done
if command -v pm2 >/dev/null 2>&1; then
  pass "pm2 available"
else
  warn "pm2 not in PATH (first deploy will use pm2 start)"
fi

echo ""
echo "▶ Disk space"
if command -v df >/dev/null 2>&1; then
  AVAIL_KB="$(df -Pk "$APP_DIR" | awk 'NR==2 {print $4}')"
  if [[ "${AVAIL_KB:-0}" -ge 2097152 ]]; then
    pass "≥ 2 GiB free on app volume"
  else
    warn "low disk — ${AVAIL_KB} KiB free (recommend ≥ 2 GiB before build)"
  fi
fi

echo ""
echo "▶ Environment files"
if [[ -f .env ]]; then
  pass ".env present"
else
  fail ".env missing — copy from .env.production.example"
fi
if [[ -f deploy/ops-secrets.env ]]; then
  pass "deploy/ops-secrets.env present"
else
  warn "deploy/ops-secrets.env missing (GSTIN, GA4, METRICS_SCRAPE_TOKEN)"
fi

echo ""
echo "▶ Env validation (no secrets printed)"
if npm run check:env >/tmp/vibe-check-env.txt 2>&1; then
  pass "check:env passed"
else
  cat /tmp/vibe-check-env.txt
  fail "check:env reported missing production keys"
fi

echo ""
echo "▶ Runtime probes (when app is already running)"
if curl -sf --max-time 5 "http://127.0.0.1:3000/api/healthz" >/dev/null 2>&1; then
  pass "pre-deploy /api/healthz reachable"
  if curl -sf --max-time 5 "http://127.0.0.1:3000/api/readyz" >/dev/null 2>&1; then
    pass "pre-deploy /api/readyz reachable"
  else
    warn "pre-deploy /api/readyz not ready (ok during cold start)"
  fi
else
  warn "app not running on :3000 yet (ok for first deploy)"
fi

echo ""
if [[ "$FAILS" -eq 0 ]]; then
  echo "✅ Preflight PASS — safe to run deploy/update.sh"
  echo ""
  exit 0
fi

echo "❌ Preflight FAIL — $FAILS blocking issue(s). Fix before deploy."
echo ""
exit 1

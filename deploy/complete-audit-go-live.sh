#!/usr/bin/env bash
# One-shot audit go-live: L-22, L-23, L-30 + full deploy (run on VPS as root).
#
# Prerequisites:
#   1. Cloudflare: vibemusic.in proxied (orange cloud) — see deploy/cloudflare/README.md
#   2. deploy/ops-secrets.env filled (legal name, GSTIN, GA4, phone)
#
# Usage:
#   cp deploy/ops-secrets.env.example deploy/ops-secrets.env
#   nano deploy/ops-secrets.env
#   sudo bash deploy/complete-audit-go-live.sh
#
# After Cloudflare is live:
#   sudo CLOUDFLARE_ONLY=1 bash deploy/complete-audit-go-live.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Vibe Music — Audit go-live (L-22 / L-23 / L-30)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── Merge ops secrets (legal entity, GSTIN, phone, analytics) ─────────────
echo "▶ Merge deploy/ops-secrets.env → .env"
node scripts/ops/merge-ops-secrets.mjs

ensure_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" .env 2>/dev/null; then
    return 0
  fi
  echo "${key}=${value}" >> .env
  echo "   + appended ${key}"
}

# L-30 + L-22 proxy trust (safe defaults when behind nginx/Cloudflare)
ensure_env "TRUST_PROXY_HOPS" "1"

if ! grep -q "^NEXT_PUBLIC_LEGAL_ENTITY_NAME=.\+" .env 2>/dev/null; then
  echo "   ⚠️  NEXT_PUBLIC_LEGAL_ENTITY_NAME not set — footer shows default 'Vibe Music'"
fi
if ! grep -q "^NEXT_PUBLIC_GSTIN=.\+" .env 2>/dev/null; then
  echo "   ⚠️  NEXT_PUBLIC_GSTIN not set — add to deploy/ops-secrets.env for L-30"
fi

echo ""
echo "▶ Full deploy (migrate, build, PM2, nginx)"
SKIP_PULL=0 bash deploy/update.sh

echo ""
echo "▶ Seed store settings (phone, GSTIN from env)"
npx tsx --env-file=.env scripts/ops/seed-production-ops.mts || true

if [ "${CLOUDFLARE_ONLY:-0}" = "1" ]; then
  echo ""
  echo "▶ L-23 — Lock origin firewall to Cloudflare IPs"
  bash deploy/cloudflare-ufw.sh
fi

echo ""
echo "▶ L-22 — Edge header check"
if VERIFY_BASE_URL=https://vibemusic.in npm run check:edge; then
  echo "   ✅ CDN/WAF edge detected"
else
  echo "   ⚠️  No cf-ray yet — complete Cloudflare setup (deploy/cloudflare/README.md)"
  echo "   Then re-run: sudo CLOUDFLARE_ONLY=1 bash deploy/complete-audit-go-live.sh"
fi

echo ""
echo "▶ Production sign-off"
if VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff; then
  echo "   ✅ Automated sign-off passed"
else
  echo "   ⚠️  Sign-off had failures — see output above"
  exit 1
fi

if [ "${REQUIRE_CDN_EDGE:-0}" = "1" ]; then
  echo ""
  echo "▶ Strict CDN gate (REQUIRE_CDN_EDGE=true)"
  REQUIRE_CDN_EDGE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
fi

echo ""
echo "✅ Audit go-live script complete."
echo "   Optional: REQUIRE_CDN_EDGE=1 sudo bash deploy/complete-audit-go-live.sh"
echo ""

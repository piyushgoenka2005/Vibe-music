#!/usr/bin/env bash
# One-shot path to 20/20 production certification — run ON THE VPS as root.
#
#   cd ~/Vibe-music && bash deploy/production-100.sh
#
# Non-interactive (set your real 15-char West Bengal GSTIN for Sikkim Commerce House):
#   NEXT_PUBLIC_GSTIN=19XXXXXXXXXXXXX bash deploy/production-100.sh
#
# After Cloudflare orange-cloud DNS:
#   CLOUDFLARE_ONLY=1 NEXT_PUBLIC_GSTIN=19XXXXXXXXXXXXX bash deploy/production-100.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Vibe Music — production 100% (target 20/20)"
echo "═══════════════════════════════════════════════════════════"
echo ""

git fetch origin main
git pull --ff-only origin main

SECRETS="deploy/ops-secrets.env"
if [[ -z "${NEXT_PUBLIC_GSTIN:-}" ]] && [[ -f "$SECRETS" ]] && grep -qE '^NEXT_PUBLIC_GSTIN=.{15}' "$SECRETS"; then
  export NEXT_PUBLIC_GSTIN="$(grep '^NEXT_PUBLIC_GSTIN=' "$SECRETS" | cut -d= -f2-)"
fi

if [[ -z "${NEXT_PUBLIC_GSTIN:-}" ]] && [[ -f .env ]]; then
  export NEXT_PUBLIC_GSTIN="$(npx tsx --env-file=.env scripts/ops/read-store-gstin.mts 2>/dev/null || true)"
fi

if [[ -z "${NEXT_PUBLIC_GSTIN:-}" ]]; then
  echo "L-30 requires your registered 15-character GSTIN (West Bengal / Kolkata entity)."
  read -r -p "NEXT_PUBLIC_GSTIN: " NEXT_PUBLIC_GSTIN
  export NEXT_PUBLIC_GSTIN
fi

if [[ ! "$NEXT_PUBLIC_GSTIN" =~ ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$ ]]; then
  echo "ERROR: Invalid GSTIN format." >&2
  exit 1
fi

export NEXT_PUBLIC_LEGAL_ENTITY_NAME="${NEXT_PUBLIC_LEGAL_ENTITY_NAME:-Sikkim Commerce House Pvt Ltd}"

bash deploy/go-live-e2e.sh

echo ""
echo "▶ Final certification (from VPS)"
VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}" npm run verify:production-20 || {
  echo ""
  echo "If Phase 10 failed: enable Cloudflare orange-cloud, then:"
  echo "  CLOUDFLARE_ONLY=1 bash deploy/production-100.sh"
  exit 1
}

echo ""
echo "✅ Production 100% — 20/20 certified."

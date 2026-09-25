#!/usr/bin/env bash
# Fail fast before production build if Razorpay / required env is misconfigured.
# Usage: bash deploy/razorpay-preflight.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

ENV_FILE="${ENV_FILE:-.env}"
if [[ ! -f "$ENV_FILE" && -f .env.production ]]; then
  ENV_FILE=".env.production"
fi

export NODE_ENV=production

# Load site URL for the webhook hint (best-effort; verify script reads env file directly).
if [[ -f "$ENV_FILE" ]]; then
  SITE_URL="$(grep -E '^NEXT_PUBLIC_SITE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r' || true)"
fi
SITE_URL="${SITE_URL:-https://vibemusic.in}"
SITE_URL="${SITE_URL%/}"

echo "==> Production env check ($ENV_FILE)"
npm run check:env

echo ""
echo "==> Razorpay ops readiness (no charge)"
echo "    Webhook URL (Razorpay Dashboard): ${SITE_URL}/api/payment/webhook/razorpay"
echo "    Events: payment.captured, payment.failed, refund.created, refund.processed"
echo ""
# verify-razorpay-ops loads merged env (.env + .env.local + …) internally
npx tsx scripts/ops/verify-razorpay-ops.mts

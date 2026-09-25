#!/usr/bin/env bash
# Phase 9 — set L-30 legal entity + GSTIN on VPS, merge secrets, redeploy.
#
# Usage (on VPS as root):
#   cd ~/Vibe-music && bash deploy/apply-compliance.sh
#
# Or non-interactive:
#   NEXT_PUBLIC_GSTIN=19XXXXXXXXXXXXX NEXT_PUBLIC_LEGAL_ENTITY_NAME="Entity Name" bash deploy/apply-compliance.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

SECRETS_FILE="deploy/ops-secrets.env"
EXAMPLE="deploy/ops-secrets.env.example"

if [[ ! -f "$SECRETS_FILE" ]]; then
  cp "$EXAMPLE" "$SECRETS_FILE"
  echo "Created $SECRETS_FILE from example — edit values below if prompted."
fi

GSTIN="${NEXT_PUBLIC_GSTIN:-}"
LEGAL="${NEXT_PUBLIC_LEGAL_ENTITY_NAME:-}"

if [[ -z "$GSTIN" ]]; then
  read -r -p "GSTIN (15 characters): " GSTIN
fi
if [[ -z "$LEGAL" ]]; then
  read -r -p "Legal entity name [Vibe Music]: " LEGAL
  LEGAL="${LEGAL:-Vibe Music}"
fi

if [[ ! "$GSTIN" =~ ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$ ]]; then
  echo "ERROR: GSTIN must be 15 characters (Indian format)." >&2
  exit 1
fi

upsert_secret() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$SECRETS_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$SECRETS_FILE"
  else
    echo "${key}=${value}" >> "$SECRETS_FILE"
  fi
}

upsert_secret "NEXT_PUBLIC_GSTIN" "$GSTIN"
upsert_secret "NEXT_PUBLIC_LEGAL_ENTITY_NAME" "$LEGAL"

echo "==> Merging ops secrets into .env"
node scripts/ops/merge-ops-secrets.mjs

echo "==> Deploying with compliance env"
bash deploy/update.sh

echo ""
echo "==> Verify L-30"
VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}" npm run verify:prod-signoff
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}" npm run verify:prod-signoff

echo ""
echo "Phase 9 complete when compliance-gstin shows OK above."

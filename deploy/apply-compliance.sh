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

bash deploy/ensure-ops-secrets.sh

GSTIN="${NEXT_PUBLIC_GSTIN:-}"
LEGAL="${NEXT_PUBLIC_LEGAL_ENTITY_NAME:-Sikkim Commerce House Pvt Ltd}"

if [[ -z "$GSTIN" ]] && grep -qE '^NEXT_PUBLIC_GSTIN=.{15}' "$SECRETS_FILE" 2>/dev/null; then
  GSTIN="$(grep '^NEXT_PUBLIC_GSTIN=' "$SECRETS_FILE" | cut -d= -f2-)"
fi

if [[ -z "$GSTIN" ]]; then
  read -r -p "GSTIN (15 characters, required for L-30): " GSTIN
fi
if [[ -z "$LEGAL" ]]; then
  read -r -p "Legal entity name [Sikkim Commerce House Pvt Ltd]: " LEGAL
  LEGAL="${LEGAL:-Sikkim Commerce House Pvt Ltd}"
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

echo "==> Merging ops secrets into .env (force GSTIN + legal name)"
MERGE_OVERWRITE_KEYS="NEXT_PUBLIC_GSTIN,NEXT_PUBLIC_LEGAL_ENTITY_NAME" \
  node scripts/ops/merge-ops-secrets.mjs
node scripts/ops/normalize-production-env.mjs

echo "==> Syncing store settings (GSTIN visible without waiting for admin UI)"
npx tsx --env-file=.env scripts/ops/seed-production-ops.mts || true

echo "==> Deploying with compliance env"
SKIP_PULL=1 bash deploy/update.sh

echo ""
echo "==> Verify L-30"
VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}" npm run verify:prod-signoff
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}" npm run verify:prod-signoff

echo ""
echo "Phase 9 complete when compliance-gstin shows OK above."

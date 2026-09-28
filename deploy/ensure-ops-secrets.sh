#!/usr/bin/env bash
# Ensure deploy/ops-secrets.env exists with safe production defaults (no GSTIN invented).
# Usage: bash deploy/ensure-ops-secrets.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

SECRETS="deploy/ops-secrets.env"
EXAMPLE="deploy/ops-secrets.env.example"
DEFAULT_LEGAL="Sikkim Commerce House Pvt Ltd"

if [[ ! -f "$SECRETS" ]]; then
  cp "$EXAMPLE" "$SECRETS"
  echo "Created $SECRETS from example."
fi

upsert() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$SECRETS" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$SECRETS"
  else
    echo "${key}=${value}" >> "$SECRETS"
  fi
}

if ! grep -qE '^NEXT_PUBLIC_LEGAL_ENTITY_NAME=.+[^[:space:]]' "$SECRETS" 2>/dev/null || \
   grep -q '^NEXT_PUBLIC_LEGAL_ENTITY_NAME=Vibe Music$' "$SECRETS" 2>/dev/null; then
  upsert "NEXT_PUBLIC_LEGAL_ENTITY_NAME" "$DEFAULT_LEGAL"
  echo "  + NEXT_PUBLIC_LEGAL_ENTITY_NAME=$DEFAULT_LEGAL"
fi

if ! grep -qE '^METRICS_SCRAPE_TOKEN=.{16,}' "$SECRETS" 2>/dev/null; then
  TOKEN="$(openssl rand -hex 24 2>/dev/null || head -c 48 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 48)"
  upsert "METRICS_SCRAPE_TOKEN" "$TOKEN"
  echo "  + METRICS_SCRAPE_TOKEN generated"
fi

if ! grep -qE '^TRUST_PROXY_HOPS=' "$SECRETS" 2>/dev/null; then
  upsert "TRUST_PROXY_HOPS" "1"
fi

echo "OK — ops-secrets ready (set NEXT_PUBLIC_GSTIN for L-30 compliance)."

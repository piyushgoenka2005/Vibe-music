#!/usr/bin/env bash
# Wait until the app passes liveness + readiness probes (post-deploy / rollback).
# Usage: bash deploy/wait-for-ready.sh [base_url] [max_attempts]
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
BASE_URL="${BASE_URL%/}"
MAX_ATTEMPTS="${2:-20}"
SLEEP_SECS="${SLEEP_SECS:-3}"

echo "==> Readiness gate ($BASE_URL, up to ${MAX_ATTEMPTS} attempts)"

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  sleep "$SLEEP_SECS"
  HEALTH_CODE="$(curl -sS -o /tmp/vibe-health.json -w '%{http_code}' "${BASE_URL}/api/health" 2>/dev/null || echo 000)"
  READY_CODE="$(curl -sS -o /tmp/vibe-ready.json -w '%{http_code}' "${BASE_URL}/api/readyz" 2>/dev/null || echo 000)"

  if [[ "$HEALTH_CODE" == "200" && "$READY_CODE" == "200" ]]; then
    echo "    attempt $attempt: /api/health → 200, /api/readyz → 200"
    exit 0
  fi

  echo "    attempt $attempt: health=$HEALTH_CODE ready=$READY_CODE (waiting…)"
done

echo "" >&2
echo "READINESS GATE FAILED after $MAX_ATTEMPTS attempts." >&2
echo "  health: $(cat /tmp/vibe-health.json 2>/dev/null || echo n/a)" >&2
echo "  ready:  $(cat /tmp/vibe-ready.json 2>/dev/null || echo n/a)" >&2
exit 1

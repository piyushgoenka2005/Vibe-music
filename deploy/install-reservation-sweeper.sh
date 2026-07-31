#!/usr/bin/env bash
# Install inventory reservation TTL sweeper cron (RC-2).
# Usage:
#   bash deploy/install-reservation-sweeper.sh
#   RESERVATION_TTL_MINUTES=45 bash deploy/install-reservation-sweeper.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
TTL="${RESERVATION_TTL_MINUTES:-45}"
CRON_TAG="# vibe-music-reservation-sweeper"
LOG_FILE="${RESERVATION_SWEEPER_LOG:-/var/log/vibe-reservation-sweeper.log}"

echo "═══════════════════════════════════════════════════════════"
echo "  Vibe Music — Install reservation sweeper cron"
echo "═══════════════════════════════════════════════════════════"
echo "  APP_DIR=$APP_DIR"
echo "  TTL=${TTL}m"
echo

mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
touch "$LOG_FILE" 2>/dev/null || true

if [[ ! -f "$APP_DIR/scripts/ops/release-stale-reservations.mts" ]]; then
  echo "FAIL: sweeper script missing at $APP_DIR/scripts/ops/release-stale-reservations.mts"
  exit 1
fi

if [[ ! -f "$APP_DIR/.env" && ! -f "$APP_DIR/.env.local" ]]; then
  echo "FAIL: need $APP_DIR/.env (or .env.local) with DATABASE_URL"
  exit 1
fi

CRON_FILE=$(mktemp)
crontab -l 2>/dev/null | grep -v "$CRON_TAG" | grep -v 'ops:release-stale-reservations' >"$CRON_FILE" || true

{
  echo "$CRON_TAG"
  echo "SHELL=/bin/bash"
  echo "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
  echo "*/15 * * * * cd $APP_DIR && RESERVATION_TTL_MINUTES=$TTL npm run ops:release-stale-reservations >> $LOG_FILE 2>&1  $CRON_TAG"
} >>"$CRON_FILE"

crontab "$CRON_FILE"
rm -f "$CRON_FILE"

echo "▶ Crontab installed (tagged $CRON_TAG)"
crontab -l | grep "$CRON_TAG" || true
echo

echo "▶ Dry-run sweeper once"
(
  cd "$APP_DIR"
  RESERVATION_TTL_MINUTES="$TTL" npm run ops:release-stale-reservations
)

echo
echo "✅ Reservation sweeper installed (every 15 minutes)."
echo "   Log: $LOG_FILE"
echo

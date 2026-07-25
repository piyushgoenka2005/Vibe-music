#!/usr/bin/env bash
# Install daily Postgres + CDN backups and verify they work (F-14).
# Run on the VPS (or backup host) as the deploy user.
#
# Usage:
#   bash deploy/install-backups.sh
#   BACKUP_DIR=/var/backups/vibe CDN_ROOT=/var/www/cdn bash deploy/install-backups.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/vibe}"
CDN_ROOT="${CDN_ROOT:-${CDN_STORAGE_ROOT:-/var/www/cdn}}"
CRON_TAG="# vibe-music-backups"
VERIFY_SCRIPT="$APP_DIR/deploy/verify-backups.sh"

echo "═══════════════════════════════════════════════════════════"
echo "  Vibe Music — Install backups (F-14)"
echo "═══════════════════════════════════════════════════════════"
echo "  APP_DIR=$APP_DIR"
echo "  BACKUP_DIR=$BACKUP_DIR"
echo "  CDN_ROOT=$CDN_ROOT"
echo

mkdir -p "$BACKUP_DIR"

# Resolve DB URL for pg_dump (strip Prisma ?schema=)
if [[ -z "${BACKUP_DATABASE_URL:-}" ]]; then
  if [[ -f "$APP_DIR/.env" ]]; then
    # shellcheck disable=SC1091
    set -a
    # Prefer DATABASE_URL from .env without sourcing secrets into the shell log
    BACKUP_DATABASE_URL=$(grep -E '^DATABASE_URL=' "$APP_DIR/.env" | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//;s/^'"'"'//;s/'"'"'$//')
    set +a
  fi
fi

if [[ -z "${BACKUP_DATABASE_URL:-}" ]]; then
  echo "FAIL: Set BACKUP_DATABASE_URL or DATABASE_URL in $APP_DIR/.env"
  exit 1
fi

# libpq rejects ?schema=public
BACKUP_DATABASE_URL="${BACKUP_DATABASE_URL%%\?*}"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "FAIL: pg_dump not found. Install postgresql-client."
  exit 1
fi

STAMP=$(date +%Y%m%d-%H%M)
DUMP_PATH="$BACKUP_DIR/vibe-backup-${STAMP}.dump"
echo "▶ Taking Postgres dump → $DUMP_PATH"
pg_dump "$BACKUP_DATABASE_URL" -Fc -f "$DUMP_PATH"
DUMP_SIZE=$(wc -c < "$DUMP_PATH" | tr -d ' ')
echo "   OK (${DUMP_SIZE} bytes)"

if [[ -d "$CDN_ROOT" ]]; then
  CDN_TAR="$BACKUP_DIR/cdn-backup-$(date +%Y%m%d).tar.gz"
  echo "▶ Taking CDN tarball → $CDN_TAR"
  PARENT=$(dirname "$CDN_ROOT")
  BASE=$(basename "$CDN_ROOT")
  tar -czf "$CDN_TAR" -C "$PARENT" "$BASE"
  TAR_SIZE=$(wc -c < "$CDN_TAR" | tr -d ' ')
  echo "   OK (${TAR_SIZE} bytes)"
else
  echo "⚠ CDN_ROOT missing ($CDN_ROOT) — skipping CDN tarball (Postgres dump still installed)"
  # Create a tiny placeholder so verify script can be taught separately; prefer real CDN.
fi

# Install / refresh crontab fragment
CRON_FILE=$(mktemp)
crontab -l 2>/dev/null | grep -v "$CRON_TAG" | grep -v 'vibe-backup-\*' | grep -v 'cdn-backup-\*' | grep -v 'verify-backups.sh' >"$CRON_FILE" || true

{
  echo "$CRON_TAG"
  echo "SHELL=/bin/bash"
  echo "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
  echo "BACKUP_DATABASE_URL=$BACKUP_DATABASE_URL"
  echo "15 2 * * * mkdir -p $BACKUP_DIR && pg_dump \"\$BACKUP_DATABASE_URL\" -Fc -f \"$BACKUP_DIR/vibe-backup-\$(date +\\%Y\\%m\\%d-\\%H\\%M).dump\" && find $BACKUP_DIR -name 'vibe-backup-*.dump' -mtime +14 -delete  $CRON_TAG"
  if [[ -d "$CDN_ROOT" ]]; then
    PARENT=$(dirname "$CDN_ROOT")
    BASE=$(basename "$CDN_ROOT")
    echo "45 2 * * * mkdir -p $BACKUP_DIR && tar -czf \"$BACKUP_DIR/cdn-backup-\$(date +\\%Y\\%m\\%d).tar.gz\" -C \"$PARENT\" \"$BASE\" && find $BACKUP_DIR -name 'cdn-backup-*.tar.gz' -mtime +14 -delete  $CRON_TAG"
  fi
  echo "0 4 * * 1 BACKUP_DIR=$BACKUP_DIR CDN_BACKUP_DIR=$BACKUP_DIR MAX_AGE_HOURS=36 bash $VERIFY_SCRIPT >> /var/log/vibe-backup-verify.log 2>&1  $CRON_TAG"
} >>"$CRON_FILE"

crontab "$CRON_FILE"
rm -f "$CRON_FILE"
echo "▶ Crontab installed (tagged $CRON_TAG)"
crontab -l | grep "$CRON_TAG" || true
echo

echo "▶ Verifying backups"
BACKUP_DIR="$BACKUP_DIR" CDN_BACKUP_DIR="$BACKUP_DIR" MAX_AGE_HOURS=36 bash "$VERIFY_SCRIPT"

echo
echo "✅ Backups installed and verified."
echo "   Reminder: rsync/copy $BACKUP_DIR off-server regularly."
echo

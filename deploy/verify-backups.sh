#!/usr/bin/env bash
# Verify recent Postgres + CDN backups exist (F-14 ops gate).
# Run on the VPS (or wherever backups are written).
#
# Usage:
#   BACKUP_DIR=/var/backups/vibe CDN_BACKUP_DIR=/var/backups/vibe bash deploy/verify-backups.sh
#   MAX_AGE_HOURS=36 bash deploy/verify-backups.sh

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/vibe}"
CDN_BACKUP_DIR="${CDN_BACKUP_DIR:-$BACKUP_DIR}"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-36}"
MAX_AGE_SECS=$((MAX_AGE_HOURS * 3600))
NOW=$(date +%s)
FAIL=0

echo "Vibe backup verification"
echo "  BACKUP_DIR=$BACKUP_DIR"
echo "  CDN_BACKUP_DIR=$CDN_BACKUP_DIR"
echo "  MAX_AGE_HOURS=$MAX_AGE_HOURS"
echo

check_recent() {
  local label="$1"
  local dir="$2"
  local pattern="$3"

  if [[ ! -d "$dir" ]]; then
    echo "FAIL  $label — directory missing: $dir"
    FAIL=1
    return
  fi

  local newest=""
  local newest_mtime=0
  # shellcheck disable=SC2086
  while IFS= read -r -d '' file; do
    local mtime
    mtime=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file")
    if (( mtime > newest_mtime )); then
      newest_mtime=$mtime
      newest=$file
    fi
  done < <(find "$dir" -maxdepth 2 -type f \( $pattern \) -print0 2>/dev/null || true)

  if [[ -z "$newest" ]]; then
    echo "FAIL  $label — no matching files in $dir"
    FAIL=1
    return
  fi

  local age=$((NOW - newest_mtime))
  local size
  size=$(stat -c %s "$newest" 2>/dev/null || stat -f %z "$newest")
  if (( size < 1024 )); then
    echo "FAIL  $label — newest file too small (${size}B): $newest"
    FAIL=1
    return
  fi
  if (( age > MAX_AGE_SECS )); then
    echo "FAIL  $label — newest file older than ${MAX_AGE_HOURS}h: $newest (age ${age}s)"
    FAIL=1
    return
  fi

  echo "OK    $label — $newest (${size}B, age ${age}s)"
}

check_recent "postgres dump" "$BACKUP_DIR" "-name 'vibe-backup-*.dump' -o -name 'vibe-backup-*.sql' -o -name '*.dump'"
check_recent "cdn tarball" "$CDN_BACKUP_DIR" "-name 'cdn-backup-*.tar.gz' -o -name 'cdn-*.tar.gz'"

echo
if (( FAIL > 0 )); then
  echo "Backup verification FAILED. See docs/ops/DEPLOYMENT.md#backup-checklist"
  exit 1
fi

echo "Backup verification passed."
exit 0

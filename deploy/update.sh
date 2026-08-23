#!/usr/bin/env bash
# Production update on the VPS.
# Usage: cd ~/Vibe-music && bash deploy/update.sh
# Optional: SEED_CATALOG=1 bash deploy/update.sh
# Optional: SKIP_SMOKE=1 bash deploy/update.sh
#
# Safety features (Phase 1):
#   - records the currently-live commit to .deploy-previous.sha before pulling
#     (used by deploy/rollback.sh)
#   - best-effort pg_dump backup before migrations (~/backups/pre-deploy-*.sql.gz,
#     keeps last 7)
#   - hard health gate after restart: non-zero exit if /api/health is not OK
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

echo "==> Recording current release for rollback"
git rev-parse HEAD > .deploy-previous.sha
echo "    previous=$(cat .deploy-previous.sha)"

echo "==> Pulling latest main"
if [[ "${SKIP_PULL:-0}" == "1" ]]; then
  echo "   (SKIP_PULL=1 — already up to date)"
else
  git fetch origin main
  git pull --ff-only origin main
fi
echo "    deploying $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

echo "==> Pre-migration database backup"
if [[ -n "${DATABASE_URL:-}" ]] && command -v pg_dump >/dev/null 2>&1; then
  BACKUP_DIR="${HOME}/backups"
  mkdir -p "$BACKUP_DIR"
  STAMP="$(date +%Y%m%d-%H%M%S)"
  # DATABASE_URL may carry a schema query param — strip it for pg_dump URL form.
  DUMP_URL="${DATABASE_URL%%\?*}"
  if pg_dump --no-owner -Fc -f "$BACKUP_DIR/pre-deploy-$STAMP.dump" "$DUMP_URL" 2>/dev/null; then
    echo "    saved $BACKUP_DIR/pre-deploy-$STAMP.dump"
    ls -1t "$BACKUP_DIR"/pre-deploy-*.dump 2>/dev/null | tail -n +8 | xargs -r rm -f --
  else
    echo "    WARN: pg_dump failed — continuing without backup" >&2
  fi
else
  echo "    SKIP (pg_dump or DATABASE_URL unavailable)"
fi

echo "==> Installing dependencies"
npm ci

echo "==> Database migrations"
npm run db:migrate

if [[ "${SEED_CATALOG:-0}" == "1" ]]; then
  echo "==> Seeding catalog from JSON"
  npm run seed:catalog
fi

echo "==> Clearing stale Next.js build cache"
rm -rf .next

echo "==> Type-check"
npm run type-check

echo "==> Building"
export NODE_ENV=production
export ALLOW_POSTGRES_DURING_BUILD="${ALLOW_POSTGRES_DURING_BUILD:-true}"
npm run build

echo "==> Gear story videos (optional)"
npm run verify:gear-videos || true

echo "==> Ensuring PM2 log directory"
mkdir -p /var/log/vibe

echo "==> Restarting PM2"
if pm2 describe vibe >/dev/null 2>&1; then
  pm2 restart vibe --update-env
else
  pm2 start deploy/ecosystem.config.cjs --update-env
fi
pm2 save

echo "==> Health gate (up to 60s for cold start + first DB probe)"
HEALTH_OK=0
for attempt in $(seq 1 20); do
  sleep 3
  HTTP_CODE="$(curl -sS -o /tmp/vibe-health.json -w '%{http_code}' http://127.0.0.1:3000/api/health || echo 000)"
  if [[ "$HTTP_CODE" == "200" ]]; then
    HEALTH_OK=1
    echo "    attempt $attempt: /api/health → 200 OK"
    break
  fi
  echo "    attempt $attempt: /api/health → $HTTP_CODE (waiting…)"
done

if [[ "$HEALTH_OK" != "1" ]]; then
  echo "" >&2
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" >&2
  echo "DEPLOY FAILED HEALTH GATE after restart." >&2
  echo "Last response: $(cat /tmp/vibe-health.json 2>/dev/null || echo 'no body')" >&2
  echo "Roll back with:  bash deploy/rollback.sh" >&2
  echo "PM2 logs:        pm2 logs vibe --lines 100" >&2
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" >&2
  exit 1
fi

if [[ "${SKIP_SMOKE:-0}" != "1" ]]; then
  echo "==> Post-deploy smoke"
  bash deploy/post-deploy-smoke.sh
fi

echo "Update complete."
if [[ "${SEED_CATALOG:-0}" != "1" ]]; then
  echo "Tip: run SEED_CATALOG=1 bash deploy/update.sh after catalog JSON changes."
fi
echo "Tip: install sweeper once with bash deploy/install-reservation-sweeper.sh"

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

if [[ "${SKIP_PREFLIGHT:-0}" != "1" ]]; then
  bash deploy/preflight.sh
fi

echo "==> Recording current release for rollback"
git rev-parse HEAD > .deploy-previous.sha
echo "    previous=$(cat .deploy-previous.sha)"

echo "==> Pulling latest main"
if [[ "${SKIP_PULL:-0}" == "1" ]]; then
  echo "   (SKIP_PULL=1 — already up to date)"
else
  git fetch origin main
  git checkout -- package-lock.json 2>/dev/null || true
  git pull --ff-only origin main
fi
DEPLOY_SHA="$(git rev-parse HEAD)"
echo "    deploying $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

echo "==> Recording GIT_COMMIT_SHA for /api/health"
if grep -q '^GIT_COMMIT_SHA=' .env 2>/dev/null; then
  sed -i "s/^GIT_COMMIT_SHA=.*/GIT_COMMIT_SHA=${DEPLOY_SHA}/" .env
else
  echo "GIT_COMMIT_SHA=${DEPLOY_SHA}" >> .env
fi
export GIT_COMMIT_SHA="${DEPLOY_SHA}"

echo "==> Pre-migration database backup"
if [[ -z "${DATABASE_URL:-}" ]] && [[ -f scripts/ops/load-merged-env.mjs ]]; then
  DATABASE_URL="$(node scripts/ops/load-merged-env.mjs --get DATABASE_URL 2>/dev/null || true)"
  export DATABASE_URL
fi
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
npm ci || npm install --no-audit

echo "==> Normalize production env (phone, TRUST_PROXY_HOPS)"
node scripts/ops/normalize-production-env.mjs

if [[ -f deploy/ops-secrets.env ]]; then
  echo "==> Merge deploy/ops-secrets.env → .env"
  node scripts/ops/merge-ops-secrets.mjs
fi

echo "==> Database migrations"
npm run db:migrate

echo "==> Production ops banner sync"
npx tsx --env-file=.env scripts/ops/seed-production-ops.mts || true

echo "==> Reconcile product review aggregates (fix stale counts)"
npx tsx --env-file=.env scripts/ops/reconcile-product-review-aggregates.mts || true

if [[ "${SEED_CATALOG:-0}" == "1" ]]; then
  echo "==> Seeding catalog from JSON"
  npm run seed:catalog
fi

echo "==> Clearing stale Next.js build cache"
rm -rf .next

echo "==> Ensuring storefront static images (public/images)"
npm run download:images

echo "==> Production env + Razorpay preflight"
bash deploy/razorpay-preflight.sh

echo "==> Type-check"
npm run type-check

echo "==> Building"
export NODE_ENV=production
export ALLOW_POSTGRES_DURING_BUILD="${ALLOW_POSTGRES_DURING_BUILD:-true}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"
npm run build

echo "==> Gear story videos (optional)"
npm run verify:gear-videos || true

echo "==> Ensuring PM2 log directory"
mkdir -p /var/log/vibe

echo "==> Restarting PM2"
if pm2 describe vibe >/dev/null 2>&1; then
  pm2 reload vibe --update-env
else
  pm2 start deploy/ecosystem.config.cjs --update-env
fi
pm2 save

if command -v nginx >/dev/null 2>&1; then
  CDN_ROOT="${CDN_STORAGE_ROOT:-/var/www/cdn}"
  mkdir -p "$CDN_ROOT"
  echo "==> Ensuring CDN static root at $CDN_ROOT"

  if [[ -f deploy/nginx/vibemusic.in.conf ]]; then
    echo "==> Syncing Nginx site config from repo"
    install -d /etc/nginx/sites-available /etc/nginx/sites-enabled
    cp deploy/nginx/vibemusic.in.conf /etc/nginx/sites-available/vibemusic.in
    ln -sf /etc/nginx/sites-available/vibemusic.in /etc/nginx/sites-enabled/vibemusic.in 2>/dev/null || true
  fi
  if [[ -f deploy/nginx/cdn.vibemusic.in.conf ]]; then
    echo "==> Syncing CDN Nginx site config from repo"
    cp deploy/nginx/cdn.vibemusic.in.conf /etc/nginx/sites-available/cdn.vibemusic.in
    ln -sf /etc/nginx/sites-available/cdn.vibemusic.in /etc/nginx/sites-enabled/cdn.vibemusic.in 2>/dev/null || true
  fi
  # Remove legacy Cloudflare real-IP config if present (stack is CloudOnFire direct).
  rm -f /etc/nginx/conf.d/cloudflare-real-ip.conf 2>/dev/null || true
  # Long server_name lists (www/cdn/mail) overflow the default 32/64 hash bucket and nginx refuses to start.
  if ! grep -rqsE '^\s*server_names_hash_bucket_size' /etc/nginx/nginx.conf /etc/nginx/conf.d/; then
    echo 'server_names_hash_bucket_size 128;' > /etc/nginx/conf.d/00-hash.conf
  fi
  if [[ -f /etc/nginx/sites-available/vibemusic.in ]] || [[ -f /etc/nginx/sites-available/cdn.vibemusic.in ]]; then
    nginx -t
    if command -v systemctl >/dev/null 2>&1; then
      sudo systemctl reload-or-restart nginx 2>/dev/null || systemctl reload-or-restart nginx
    fi
  fi
fi

if ! bash deploy/wait-for-ready.sh "http://127.0.0.1:3000" 20; then
  echo "" >&2
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" >&2
  echo "DEPLOY FAILED READINESS GATE after restart." >&2
  echo "Roll back with:  bash deploy/rollback.sh" >&2
  echo "PM2 logs:        pm2 logs vibe --lines 100" >&2
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" >&2
  exit 1
fi

echo "==> Purging Nginx SSR page cache (after app is healthy)"
rm -rf /var/cache/nginx/vibe-pages/* 2>/dev/null || true

if [[ "${SKIP_SMOKE:-0}" != "1" ]]; then
  echo "==> Post-deploy smoke (API via loopback)"
  API_BASE_URL="http://127.0.0.1:3000" BASE_URL="${SMOKE_BASE_URL:-http://127.0.0.1:3000}" \
    bash deploy/post-deploy-smoke.sh
fi

echo "==> Reservation sweeper (release stale holds)"
# Brief pause so Postgres is warm after PM2 reload before batch sweeper runs.
sleep 3
npm run ops:release-stale-reservations || echo "    WARN: sweeper failed — check PM2 logs" >&2

echo "Update complete."
if [[ "${SEED_CATALOG:-0}" != "1" ]]; then
  echo "Tip: run SEED_CATALOG=1 bash deploy/update.sh after catalog JSON changes."
fi
echo "Tip: install sweeper cron once with bash deploy/install-reservation-sweeper.sh"

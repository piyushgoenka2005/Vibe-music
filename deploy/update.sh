#!/usr/bin/env bash
# Production deploy on the CloudOnFire VPS (GoDaddy DNS → nginx → PM2 → PostgreSQL).
#
# Usage:
#   cd ~/Vibe-music && bash deploy/update.sh
#
# Options:
#   SEED_CATALOG=1          Re-import catalog JSON after migrate
#   SKIP_PULL=1             Skip git fetch/pull (already on target commit)
#   SKIP_PREFLIGHT=1        Skip deploy/preflight.sh
#   SKIP_SMOKE=1            Skip post-deploy smoke tests
#   SKIP_BUILD=0            Set to 1 to reload PM2 without rebuild (hotfix env-only)
#   SYNC_SSL=1              Run deploy/fix-ssl-certificates.sh after nginx sync
#   VERIFY_PUBLIC_SMOKE=1   Also smoke-test https://vibemusic.in via nginx (default: 1)
#   SKIP_NGINX_VERIFY=1     Skip public nginx routing gate (not recommended)
#
# Safety:
#   - Records .deploy-previous.sha before pull (deploy/rollback.sh)
#   - Best-effort pg_dump before migrations (~/backups/pre-deploy-*.dump, keep 7)
#   - Hard gate on /api/health + /api/readyz after PM2 restart
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

VPS_IP="${VPS_IP:-31.42.125.219}"
PUBLIC_BASE="${PUBLIC_BASE_URL:-https://vibemusic.in}"
LOOPBACK="http://127.0.0.1:3000"
VERIFY_PUBLIC_SMOKE="${VERIFY_PUBLIC_SMOKE:-1}"

log()  { echo "==> $*"; }
step() { echo ""; echo "── $* ──"; }
warn() { echo "    WARN: $*" >&2; }

die() {
  echo "" >&2
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" >&2
  echo "DEPLOY FAILED: $*" >&2
  echo "Roll back:  bash deploy/rollback.sh" >&2
  echo "PM2 logs:   pm2 logs vibe --lines 100" >&2
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" >&2
  exit 1
}

load_database_url() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    return 0
  fi
  if [[ -f scripts/ops/load-merged-env.mjs ]]; then
    DATABASE_URL="$(node scripts/ops/load-merged-env.mjs --get DATABASE_URL 2>/dev/null || true)"
    export DATABASE_URL
  fi
}

record_git_commit_in_env() {
  local sha="$1"
  if grep -q '^GIT_COMMIT_SHA=' .env 2>/dev/null; then
    sed -i "s/^GIT_COMMIT_SHA=.*/GIT_COMMIT_SHA=${sha}/" .env
  else
    echo "GIT_COMMIT_SHA=${sha}" >> .env
  fi
  export GIT_COMMIT_SHA="${sha}"
}

backup_database() {
  load_database_url
  if [[ -z "${DATABASE_URL:-}" ]] || ! command -v pg_dump >/dev/null 2>&1; then
    log "Pre-migration backup SKIP (pg_dump or DATABASE_URL unavailable)"
    return 0
  fi

  local backup_dir="${HOME}/backups"
  local stamp dump_url
  mkdir -p "$backup_dir"
  stamp="$(date +%Y%m%d-%H%M%S)"
  dump_url="${DATABASE_URL%%\?*}"

  if pg_dump --no-owner -Fc -f "$backup_dir/pre-deploy-${stamp}.dump" "$dump_url" 2>/dev/null; then
    log "Pre-migration backup saved: $backup_dir/pre-deploy-${stamp}.dump"
    ls -1t "$backup_dir"/pre-deploy-*.dump 2>/dev/null | tail -n +8 | xargs -r rm -f --
  else
    echo "    WARN: pg_dump failed — continuing without backup" >&2
  fi
}

stop_app_for_build() {
  if pm2 describe vibe >/dev/null 2>&1; then
    log "Stopping PM2 vibe (avoid serving partial .next)"
    pm2 stop vibe || true
  fi
}

build_application() {
  log "Clearing stale Next.js build cache"
  rm -rf .next

  log "Storefront static images (public/images + location landmarks)"
  npm run download:images

  log "Razorpay + production env preflight"
  bash deploy/razorpay-preflight.sh

  log "Type-check"
  npm run type-check

  log "Production build"
  export NODE_ENV=production
  export ALLOW_POSTGRES_DURING_BUILD="${ALLOW_POSTGRES_DURING_BUILD:-true}"
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"
  npm run build

  log "Gear story videos (optional)"
  npm run verify:gear-videos || true
}

restart_pm2() {
  mkdir -p /var/log/vibe

  log "Restarting PM2 (vibe + vibe-worker)"
  if pm2 describe vibe >/dev/null 2>&1; then
    pm2 reload deploy/ecosystem.config.cjs --update-env
  else
    pm2 start deploy/ecosystem.config.cjs --update-env
  fi
  pm2 save
}

purge_nginx_page_cache() {
  log "Purging nginx SSR page cache"
  rm -rf /var/cache/nginx/vibe-pages/* 2>/dev/null || true
}

ensure_cdn_storage() {
  local cdn_root="${CDN_STORAGE_ROOT:-/var/www/cdn}"
  log "Ensuring CDN storage at $cdn_root"
  mkdir -p "$cdn_root/products" "$cdn_root/banners" "$cdn_root/blog" "$cdn_root/reviews"
  chmod -R u+rwX,g+rwX "$cdn_root" 2>/dev/null || true
}

validate_production_env() {
  log "Production env validation (check:env)"
  if ! npm run check:env >/tmp/vibe-check-env-deploy.txt 2>&1; then
    cat /tmp/vibe-check-env-deploy.txt >&2
    die "check:env failed — fix .env and deploy/ops-secrets.env before deploy"
  fi
}

verify_nginx_routes_vibe() {
  if [[ "${SKIP_NGINX_VERIFY:-0}" == "1" ]]; then
    log "Public nginx verify skipped (SKIP_NGINX_VERIFY=1)"
    return 0
  fi
  if ! command -v curl >/dev/null 2>&1; then
    warn "curl missing — skipping nginx routing verify"
    return 0
  fi

  log "Verifying nginx routes vibemusic.in → Next.js (not Gitea/panel)"
  local headers health_body
  headers="$(curl -skI --max-time 12 -H "Host: vibemusic.in" "https://127.0.0.1/api/health" 2>/dev/null || true)"

  if echo "$headers" | grep -qiE 'location:.*/user/login|i_like_gitea='; then
    echo "$headers" >&2
    die "nginx still routes vibemusic.in to Gitea — run: bash deploy/sync-nginx.sh"
  fi

  health_body="$(curl -sk --max-time 12 -H "Host: vibemusic.in" "https://127.0.0.1/api/health" 2>/dev/null || true)"
  if ! echo "$health_body" | grep -q '"status"'; then
    echo "    Response: $(echo "$health_body" | head -c 200)" >&2
    die "nginx /api/health did not return Vibe JSON — check PM2 and deploy/nginx/vibemusic.in.conf"
  fi

  log "nginx public routing OK (vibemusic.in → app)"
}

run_smoke_tests() {
  if [[ "${SKIP_SMOKE:-0}" == "1" ]]; then
    log "Smoke tests skipped (SKIP_SMOKE=1)"
    return 0
  fi

  log "Post-deploy smoke (loopback APIs)"
  API_BASE_URL="$LOOPBACK" BASE_URL="$LOOPBACK" bash deploy/post-deploy-smoke.sh

  if [[ "${VERIFY_PUBLIC_SMOKE:-0}" == "1" ]]; then
    log "Post-deploy smoke (public URL via nginx: $PUBLIC_BASE)"
    API_BASE_URL="$LOOPBACK" BASE_URL="$PUBLIC_BASE" \
      bash deploy/post-deploy-smoke.sh || echo "    WARN: public smoke had failures" >&2
  fi
}

run_edge_check() {
  local base="${VERIFY_BASE_URL:-}"
  if [[ -z "$base" ]]; then
    return 0
  fi
  log "Production edge check ($base)"
  VERIFY_BASE_URL="$base" npm run check:edge || echo "    WARN: check:edge failed" >&2
}

print_summary() {
  local short_sha health_body
  short_sha="$(git rev-parse --short HEAD)"
  health_body="$(curl -sf --max-time 10 "${LOOPBACK}/api/health" 2>/dev/null || echo '{}')"

  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "  Deploy complete — CloudOnFire VPS"
  echo "═══════════════════════════════════════════════════════════"
  echo "  Commit:     ${short_sha} — $(git log -1 --pretty=%s)"
  echo "  VPS:        root@${VPS_IP}"
  echo "  Public:     ${PUBLIC_BASE}"
  echo "  Loopback:   ${LOOPBACK}/api/health"
  echo "  Health:     $(echo "$health_body" | head -c 120)"
  echo ""
  echo "  Verify live:  VERIFY_BASE_URL=${PUBLIC_BASE} npm run verify:prod-signoff"
  echo "  Nginx sync:   bash deploy/sync-nginx.sh"
  echo "  SSL expand:   SYNC_SSL=1 bash deploy/update.sh"
  echo "  Rollback:     bash deploy/rollback.sh"
  if [[ "${SEED_CATALOG:-0}" != "1" ]]; then
    echo "  Catalog:      SEED_CATALOG=1 bash deploy/update.sh"
  fi
  echo "  Sweeper cron: bash deploy/install-reservation-sweeper.sh"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
}

# ── 0. Preflight ─────────────────────────────────────────────────────────────

if [[ "${SKIP_PREFLIGHT:-0}" != "1" ]]; then
  bash deploy/preflight.sh
fi

# ── 1. Source control ────────────────────────────────────────────────────────

step "1/10 — Git"

log "Recording rollback pointer (.deploy-previous.sha)"
git rev-parse HEAD > .deploy-previous.sha
echo "    previous=$(cat .deploy-previous.sha)"

if [[ "${SKIP_PULL:-0}" == "1" ]]; then
  log "Git pull skipped (SKIP_PULL=1)"
else
  log "Pulling origin/main"
  git fetch origin main
  git checkout -- package-lock.json 2>/dev/null || true
  git pull --ff-only origin main
fi

DEPLOY_SHA="$(git rev-parse HEAD)"
log "Deploying $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

record_git_commit_in_env "$DEPLOY_SHA"

# ── 2. Dependencies + env ──────────────────────────────────────────────────────

step "2/10 — Dependencies and environment"

backup_database

install_dependencies() {
  log "Installing npm dependencies (node $(node -v), npm $(npm -v))"
  # Guard against partial installs leaving a drifted lockfile on the VPS.
  git checkout -- package-lock.json package.json 2>/dev/null || true

  if npm ci --no-audit --ignore-scripts; then
    return 0
  fi

  warn "npm ci failed — cleaning node_modules and running npm install"
  rm -rf node_modules
  npm install --no-audit --ignore-scripts
}

install_dependencies

log "Prisma client"
npm run db:generate

log "Normalize production env"
node scripts/ops/normalize-production-env.mjs

if [[ -f deploy/ops-secrets.env ]]; then
  log "Merge deploy/ops-secrets.env → .env"
  node scripts/ops/merge-ops-secrets.mjs
fi

if [[ -f deploy/ensure-ops-secrets.sh ]]; then
  log "Ensure ops secrets (GSTIN, Upstash, GA4 placeholders)"
  bash deploy/ensure-ops-secrets.sh || warn "ensure-ops-secrets.sh had warnings"
fi

ensure_cdn_storage
validate_production_env

# ── 3. Database + ops data ───────────────────────────────────────────────────

step "3/10 — Database"

log "Migrations"
npm run db:migrate

log "Production ops banner sync"
npx tsx --env-file=.env scripts/ops/seed-production-ops.mts || true

log "Reconcile product review aggregates"
npx tsx --env-file=.env scripts/ops/reconcile-product-review-aggregates.mts || true

if [[ "${SEED_CATALOG:-0}" == "1" ]]; then
  log "Seeding catalog from JSON"
  npm run seed:catalog
fi

# ── 4. Build ─────────────────────────────────────────────────────────────────

step "4/10 — Build"

if [[ "${SKIP_BUILD:-0}" == "1" ]]; then
  log "Build skipped (SKIP_BUILD=1) — reloading PM2 only"
else
  stop_app_for_build
  build_application
fi

# ── 5. PM2 ───────────────────────────────────────────────────────────────────

step "5/10 — PM2"

restart_pm2

# ── 6. Nginx + CDN ───────────────────────────────────────────────────────────

step "6/10 — Nginx and CDN"

ensure_cdn_storage

if command -v nginx >/dev/null 2>&1; then
  bash deploy/sync-nginx.sh
  if [[ "${SYNC_SSL:-0}" == "1" && -f deploy/fix-ssl-certificates.sh ]]; then
    log "SSL certificate sync (SYNC_SSL=1)"
    bash deploy/fix-ssl-certificates.sh
  fi
  verify_nginx_routes_vibe
else
  log "nginx not installed — skipping vhost sync"
fi

# ── 7. Readiness gate ──────────────────────────────────────────────────────────

step "7/10 — Readiness gate"

if ! bash deploy/wait-for-ready.sh "$LOOPBACK" 25; then
  die "App did not pass /api/health + /api/readyz after restart"
fi

purge_nginx_page_cache

# ── 8. Smoke tests ───────────────────────────────────────────────────────────

step "8/10 — Smoke tests"

run_smoke_tests

# ── 9. Housekeeping ──────────────────────────────────────────────────────────

step "9/10 — Housekeeping"

log "Reservation sweeper (release stale holds)"
sleep 2
npm run ops:release-stale-reservations || echo "    WARN: sweeper failed — check PM2 logs" >&2

# ── 10. Optional edge verification ─────────────────────────────────────────────

step "10/10 — Edge verification"

run_edge_check

print_summary

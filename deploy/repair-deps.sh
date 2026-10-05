#!/usr/bin/env bash
# Recover from a partial/corrupt node_modules on the VPS (e.g. interrupted npm ci).
#
# Usage:
#   cd ~/Vibe-music && bash deploy/repair-deps.sh
#
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

log() { echo "==> $*"; }
warn() { echo "    WARN: $*" >&2; }
die() { echo "DEPENDENCY REPAIR FAILED: $*" >&2; exit 1; }

log "Stopping PM2 apps (release file locks on node_modules)"
if command -v pm2 >/dev/null 2>&1; then
  pm2 stop vibe vibe-worker 2>/dev/null || true
  sleep 4
else
  warn "pm2 not in PATH — ensure no Node process is using node_modules"
fi

log "Resetting package manifests from git (discard local drift)"
git fetch origin main 2>/dev/null || true
git checkout -- package-lock.json package.json 2>/dev/null || true
git reset --hard HEAD -- package-lock.json package.json 2>/dev/null || true

if [[ -d node_modules ]]; then
  log "Removing node_modules"
  chmod -R u+w node_modules 2>/dev/null || true
  rm -rf node_modules 2>/dev/null || true
  find node_modules -mindepth 1 -delete 2>/dev/null || true
  rm -rf node_modules 2>/dev/null || true
  if [[ -d node_modules ]]; then
    stale="node_modules.stale.$(date +%s)"
    warn "moving stubborn node_modules to ${stale}"
    mv node_modules "$stale" || die "cannot remove node_modules — stop all Node processes and retry"
    rm -rf "$stale" 2>/dev/null || true &
  fi
fi

log "Verifying package-lock.json (npm 10.x)"
npm run verify:lockfile

log "Clean install (npm ci)"
if ! npm ci --no-audit --no-fund; then
  warn "npm ci failed — ensure latest main is pulled: git pull --ff-only origin main"
  warn "retrying after hard reset of package manifests"
  git reset --hard HEAD -- package-lock.json package.json 2>/dev/null || true
  if ! npm ci --no-audit --no-fund; then
    die "npm ci still failing — run: git pull --ff-only origin main && bash deploy/repair-deps.sh"
  fi
fi

log "Verify Next.js install integrity"
node scripts/ops/verify-node-modules.mjs

log "GP-9 static assets"
npm run download:gp9-assets
npm run verify:gp9-assets

log "Prisma client"
npm run db:generate

log "Rebuilding native modules (sharp)"
npm rebuild sharp --foreground-scripts 2>/dev/null || npm install sharp --no-save --foreground-scripts 2>/dev/null || true

echo ""
echo "Dependency repair complete. Restart app:"
echo "  pm2 start deploy/ecosystem.config.cjs --update-env"
echo "  pm2 save"
echo "Or run full deploy:"
echo "  bash deploy/update.sh"

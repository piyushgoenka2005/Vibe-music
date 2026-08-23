#!/usr/bin/env bash
# Roll production back to the release that was live before the most recent deploy.
#
# Usage:  cd ~/Vibe-music && bash deploy/rollback.sh
#         bash deploy/rollback.sh <git-sha>   # explicit target commit
#
# What it does:
#   1. reads .deploy-previous.sha (written by update.sh before pulling), or takes an explicit sha
#   2. checks out that commit, reinstalls deps if the lockfile changed, rebuilds
#   3. restarts PM2 and hard-gates on /api/health before declaring success
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

if [[ $# -ge 1 ]]; then
  TARGET="$1"
elif [[ -f .deploy-previous.sha ]]; then
  TARGET="$(cat .deploy-previous.sha)"
else
  echo "ERROR: no .deploy-previous.sha found and no sha argument given." >&2
  echo "Usage: bash deploy/rollback.sh <known-good-git-sha>" >&2
  exit 1
fi

CURRENT="$(git rev-parse HEAD)"
if [[ "$TARGET" == "$CURRENT" ]]; then
  echo "Nothing to roll back: HEAD is already $CURRENT"
  exit 0
fi

echo "==> Rolling back: $(git rev-parse --short HEAD) → $(git rev-parse --short "$TARGET")"
git fetch origin main || true

# Move the branch pointer back without rewriting history on the server, then
# restore origin/main afterwards so future pulls are not confused.
git checkout -q --detach "$TARGET"

echo "==> Installing dependencies"
npm ci

echo "==> Rebuilding"
rm -rf .next
export NODE_ENV=production
export ALLOW_POSTGRES_DURING_BUILD="${ALLOW_POSTGRES_DURING_BUILD:-true}"
npm run build

echo "==> Restarting PM2"
pm2 restart vibe --update-env 2>/dev/null || pm2 start deploy/ecosystem.config.cjs --update-env
pm2 save

echo "==> Health gate"
HEALTH_OK=0
for attempt in $(seq 1 20); do
  sleep 3
  HTTP_CODE="$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/health || echo 000)"
  if [[ "$HTTP_CODE" == "200" ]]; then
    HEALTH_OK=1
    echo "    attempt $attempt: /api/health → 200 OK"
    break
  fi
  echo "    attempt $attempt: → $HTTP_CODE"
done

if [[ "$HEALTH_OK" != "1" ]]; then
  echo "ROLLBACK FAILED THE HEALTH GATE — inspect pm2 logs vibe" >&2
  exit 1
fi

echo ""
echo "Rollback complete. Running commit: $(git rev-parse --short HEAD)"
echo "NOTE: local main is detached at the rollback target."
echo "      To return to latest later:  git checkout main && git reset --hard origin/main"
echo "      Then redeploy normally with bash deploy/update.sh"

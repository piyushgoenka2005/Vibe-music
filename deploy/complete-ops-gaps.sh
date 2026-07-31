#!/usr/bin/env bash
# Complete remaining platform ops gaps on the VPS (run as root or deploy user).
# Usage:
#   1. cp deploy/ops-secrets.env.example deploy/ops-secrets.env
#   2. Edit deploy/ops-secrets.env (GA4, Places, phone, GSC token)
#   3. bash deploy/complete-ops-gaps.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Vibe Music — Complete ops gaps (end-to-end deploy)"
echo "═══════════════════════════════════════════════════════════"
echo ""

MISSING=0

# ── Step 1: Pull latest code ────────────────────────────────────────────────
echo "▶ Step 1/11 — Pull latest main"
git fetch origin main
git pull --ff-only origin main
echo "   Commit: $(git log -1 --oneline)"
echo ""

# ── Step 2: Merge ops secrets into .env ───────────────────────────────────
echo "▶ Step 2/11 — Merge deploy/ops-secrets.env → .env"
node scripts/ops/merge-ops-secrets.mjs
echo ""

# ── Step 3: Verify required env ───────────────────────────────────────────
echo "▶ Step 3/11 — Check production env"
npm run check:env || true
echo ""

# ── Step 4: Install, migrate, build, restart ──────────────────────────────
echo "▶ Step 4/11 — Deploy (npm ci, migrate, build, PM2)"
SKIP_PULL=1 SKIP_SMOKE=1 bash deploy/update.sh
echo ""

# ── Step 5: Seed store phone + admin banners ──────────────────────────────
echo "▶ Step 5/11 — Seed production ops (phone, banners)"
npx tsx --env-file=.env scripts/ops/seed-production-ops.mts || true
echo ""

# ── Step 6: Gear story videos ─────────────────────────────────────────────
echo "▶ Step 6/11 — Verify gear story MP4s"
npm run verify:gear-videos || true
if [[ ! -f public/videos/style-story/reel-1.mp4 ]]; then
  echo "   Tip: scp reel-*.mp4 to public/videos/style-story/ (see README there)"
  node scripts/assets/prepare-gear-story-videos.mjs 2>/dev/null || true
fi
echo ""

# ── Step 7: Backups (F-14) ────────────────────────────────────────────────
echo "▶ Step 7/11 — Install backups (pg_dump + CDN cron)"
if bash deploy/install-backups.sh; then
  echo "   ✅ backups installed"
else
  echo "   ⚠️  backup install failed — run: bash deploy/install-backups.sh"
  MISSING=$((MISSING + 1))
fi
echo ""

# ── Step 8: Reservation sweeper (RC-2) ────────────────────────────────────
echo "▶ Step 8/11 — Install reservation sweeper cron"
if bash deploy/install-reservation-sweeper.sh; then
  echo "   ✅ reservation sweeper installed"
else
  echo "   ⚠️  sweeper install failed — run: bash deploy/install-reservation-sweeper.sh"
  MISSING=$((MISSING + 1))
fi
echo ""

# ── Step 9: Razorpay ops readiness (no charge) ────────────────────────────
echo "▶ Step 9/11 — Razorpay ops readiness"
if npx tsx --env-file=.env scripts/ops/verify-razorpay-ops.mts; then
  echo "   ✅ razorpay ops checks"
else
  echo "   ⚠️  razorpay ops warnings/failures — see output above"
  MISSING=$((MISSING + 1))
fi
echo ""

# ── Step 10: Post-deploy smoke ────────────────────────────────────────────
echo "▶ Step 10/11 — Smoke (localhost + public)"
if bash deploy/post-deploy-smoke.sh; then
  echo "   ✅ localhost smoke"
else
  echo "   ⚠️  localhost smoke failed"
  MISSING=$((MISSING + 1))
fi
if BASE_URL=https://vibemusic.in STRICT=0 bash deploy/post-deploy-smoke.sh; then
  echo "   ✅ public smoke"
else
  echo "   ⚠️  public smoke had failures (DNS/propagation or deploy lag)"
  MISSING=$((MISSING + 1))
fi
echo ""

# ── Step 11: Summary ────────────────────────────────────────────────────────
echo "▶ Step 11/11 — Gap checklist"

check_env_key() {
  local key="$1"
  if grep -q "^${key}=" .env 2>/dev/null && grep "^${key}=" .env | grep -qv "=$"; then
    echo "   ✅ $key"
  else
    echo "   ⚠️  $key — set in deploy/ops-secrets.env and re-run"
    MISSING=$((MISSING + 1))
  fi
}

check_env_key "NEXT_PUBLIC_GA_MEASUREMENT_ID"
check_env_key "GA_MEASUREMENT_API_SECRET"
check_env_key "NEXT_PUBLIC_STORE_PHONE"
check_env_key "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"

# Places is optional (Nominatim India fallback); warn only if unset
if grep -q "^GOOGLE_PLACES_API_KEY=.\+" .env 2>/dev/null || \
   grep -q "^NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=.\+" .env 2>/dev/null || \
   grep -q "^GOOGLE_MAPS_API_KEY=.\+" .env 2>/dev/null; then
  echo "   ✅ Google Places key"
else
  echo "   ℹ️  Google Places key unset — Nominatim fallback remains available"
fi

if crontab -l 2>/dev/null | grep -q 'ops:release-stale-reservations'; then
  echo "   ✅ reservation sweeper cron"
else
  echo "   ⚠️  reservation sweeper cron missing"
  MISSING=$((MISSING + 1))
fi

if [[ -f public/videos/style-story/reel-1.mp4 ]]; then
  echo "   ✅ gear story MP4s"
else
  echo "   ⚠️  gear story MP4s — posters work; upload for video"
  MISSING=$((MISSING + 1))
fi

echo ""
if [[ $MISSING -eq 0 ]]; then
  echo "✅ All ops gaps addressed. Platform deploy-ready at 100%."
else
  echo "⚠️  $MISSING item(s) still need attention (see above)."
  echo "   Edit deploy/ops-secrets.env → bash deploy/complete-ops-gaps.sh"
  echo "   Runbook: docs/ops/DEPLOY_READY.md"
fi
echo ""

#!/usr/bin/env bash
# Complete remaining platform ops gaps on the VPS (run as root or deploy user).
# Usage:
#   1. cp deploy/ops-secrets.env.example deploy/ops-secrets.env
#   2. Edit deploy/ops-secrets.env (GA4, Places, phone)
#   3. bash deploy/complete-ops-gaps.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Vibe Music — Complete ops gaps (step-by-step)"
echo "═══════════════════════════════════════════════════════════"
echo ""

MISSING=0

# ── Step 1: Pull latest code ────────────────────────────────────────────────
echo "▶ Step 1/10 — Pull latest main"
git fetch origin main
git pull --ff-only origin main
echo "   Commit: $(git log -1 --oneline)"
echo ""

# ── Step 2: Merge ops secrets into .env ───────────────────────────────────
echo "▶ Step 2/10 — Merge deploy/ops-secrets.env → .env"
node scripts/ops/merge-ops-secrets.mjs
echo ""

# ── Step 3: Verify required env ───────────────────────────────────────────
echo "▶ Step 3/10 — Check production env"
npm run check:env || true
echo ""

# ── Step 4: Install, migrate, build, restart ──────────────────────────────
echo "▶ Step 4/10 — Deploy (npm ci, migrate, build, PM2)"
bash deploy/update.sh
echo ""

# ── Step 5: Seed store phone + admin banners ──────────────────────────────
echo "▶ Step 5/10 — Seed production ops (phone, banners)"
npx tsx --env-file=.env scripts/ops/seed-production-ops.mts || true
echo ""

# ── Step 6: Gear story videos ─────────────────────────────────────────────
echo "▶ Step 6/10 — Verify gear story MP4s"
npm run verify:gear-videos || true
if [[ ! -f public/videos/style-story/reel-1.mp4 ]]; then
  echo "   Tip: scp reel-*.mp4 to public/videos/style-story/ (see README there)"
  node scripts/assets/prepare-gear-story-videos.mjs 2>/dev/null || true
fi
echo ""

# ── Step 7: Post-deploy integration smoke ─────────────────────────────────
echo "▶ Step 7/10 — Smoke test localhost"
sleep 2
HEALTH=$(curl -sS http://127.0.0.1:3000/api/health || echo '{"status":"error"}')
echo "   /api/health → $HEALTH"
CAPS=$(curl -sS http://127.0.0.1:3000/api/checkout/capabilities || echo '{}')
echo "   /api/checkout/capabilities → $CAPS"
BANNERS=$(curl -sS http://127.0.0.1:3000/api/banners || echo '{}')
echo "   /api/banners → $(echo "$BANNERS" | head -c 120)..."
echo ""

# ── Step 8: Install / verify backups (F-14) ───────────────────────────────
echo "▶ Step 8/10 — Install backups (pg_dump + CDN cron)"
if bash deploy/install-backups.sh; then
  echo "   ✅ backups installed"
else
  echo "   ⚠️  backup install failed — run: bash deploy/install-backups.sh"
  MISSING=$((MISSING + 1))
fi
echo ""

# ── Step 9: Razorpay ops readiness (no charge) ────────────────────────────
echo "▶ Step 9/10 — Razorpay ops readiness"
if npx tsx --env-file=.env scripts/ops/verify-razorpay-ops.mts; then
  echo "   ✅ razorpay ops checks"
else
  echo "   ⚠️  razorpay ops warnings/failures — see output above"
  MISSING=$((MISSING + 1))
fi
echo ""

# ── Step 10: Summary ────────────────────────────────────────────────────────
echo "▶ Step 10/10 — Gap checklist"

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
check_env_key "GOOGLE_PLACES_API_KEY"
check_env_key "NEXT_PUBLIC_STORE_PHONE"

if [[ -f public/videos/style-story/reel-1.mp4 ]]; then
  echo "   ✅ gear story MP4s"
else
  echo "   ⚠️  gear story MP4s — posters work; upload for video"
  MISSING=$((MISSING + 1))
fi

echo ""
if [[ $MISSING -eq 0 ]]; then
  echo "✅ All ops gaps addressed. Platform at 100% config."
else
  echo "⚠️  $MISSING item(s) still need values in deploy/ops-secrets.env"
  echo "   Edit secrets → bash deploy/complete-ops-gaps.sh"
fi
echo ""

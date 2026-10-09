# Production completion status (engineering)

**Live:** https://vibemusic.in · **Deploy:** `4ffa7497` (verify `/api/health` → `version`)

## Automated gates (run anytime)

```bash
VERIFY_BASE_URL=https://vibemusic.in npm run verify:external-audit-passive
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
npm run verify:e2e-catalog          # CI merge gate (22 cases)
npm run validate:ci                 # full local/CI pipeline
```

Deploy (`bash deploy/update.sh`) now runs **blocking** loopback + public smoke, Razorpay preflight (live keys), review reconcile, and **passive external audit** on the public URL.

## Done (engineering)

- Category routing, coupons API, checkout/auth E2E coverage
- Payment server-side totals, Razorpay verify + webhook, rate limits, security headers
- Policy pages SSR, legacy redirects, social URL sanitization, grievance line in footer
- Ops scripts fixed (Razorpay verify, review reconcile)
- Audit response: `docs/ops/EXTERNAL_AUDIT_V2_RESPONSE.md`

## One action left for zero-warn sign-off

**GSTIN not in homepage HTML** — engineering deploy is complete; `verify:prod-signoff` still **WARN**s until a valid 15-character GSTIN is in `deploy/ops-secrets.env` **and** a rebuild runs (`NEXT_PUBLIC_*` is baked at build time):

```bash
# On VPS (replace with your real GSTIN)
cd ~/Vibe-music
# Add to deploy/ops-secrets.env: NEXT_PUBLIC_GSTIN=19XXXXXXXXXXXZ1
bash deploy/production.sh compliance
```

Or set `NEXT_PUBLIC_GSTIN` in `deploy/ops-secrets.env`, run `node scripts/ops/merge-ops-secrets.mjs`, `npx tsx --env-file=.env scripts/ops/seed-production-ops.mts`, `pm2 restart vibe --update-env`.

## Optional (non-blocking)

- `META_CAPI_ACCESS_TOKEN` — Meta Purchase dedupe
- SPF/DKIM/DMARC for `support@vibemusic.in`
- Legal review: giveaway, rentals, gear exchange
- One live ₹1 order + refund (commercial smoke)

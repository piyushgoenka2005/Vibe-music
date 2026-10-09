# Production completion status (engineering)

**Live:** https://vibemusic.in · **Deploy:** `966f8de7` (verify `/api/health` → `version`)

## Automated gates (run anytime)

```bash
VERIFY_BASE_URL=https://vibemusic.in npm run verify:production-final
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

## Operator secrets (not in git) — then one command

Fill **`deploy/ops-secrets.env`** locally (gitignored), then:

| Secret           | Key                                                                          |
| ---------------- | ---------------------------------------------------------------------------- |
| Meta CAPI token  | `META_CAPI_ACCESS_TOKEN`                                                     |
| Meta domain tag  | `NEXT_PUBLIC_META_DOMAIN_VERIFICATION` (+ `META_DOMAIN_VERIFICATION` mirror) |
| GSTIN (15 chars) | `NEXT_PUBLIC_GSTIN`                                                          |

```bash
# Meta (local machine — pushes to VPS + redeploy)
npm run setup:meta-integration -- --from-ops-secrets
# or after editing deploy/ops-secrets.env only:
npm run ops:sync-meta-integration-vps

# GSTIN (on VPS)
bash deploy/production.sh compliance
```

Then: `VERIFY_BASE_URL=https://vibemusic.in npm run verify:production-final` (exit 0 = fully final).

## Optional (non-blocking)

- `META_CAPI_ACCESS_TOKEN` — Meta Purchase dedupe
- SPF/DKIM/DMARC for `support@vibemusic.in`
- Legal review: giveaway, rentals, gear exchange
- One live ₹1 order + refund (commercial smoke)

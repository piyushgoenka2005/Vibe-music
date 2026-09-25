# Phase 6 — Compliance & monitoring (L-29, L-30)

Last verified: 2026-09-25.

## Deliverables

| Item                                 | Location                                                                |
| ------------------------------------ | ----------------------------------------------------------------------- |
| Analytics consent on full GA4 funnel | `src/lib/analytics/gtag.ts`, `events.ts`                                |
| L-29 tests                           | `src/lib/analytics/gtag.test.ts`                                        |
| L-30 live HTML checks                | `scripts/ops/prod-signoff.mts` (`compliance-legal`, `compliance-gstin`) |
| Synthetic checkout monitor           | `scripts/ops/synthetic-checkout-monitor.mts`                            |

## L-29 — Analytics funnel (consent-first)

All client GA4 events (`page_view`, `begin_checkout`, `purchase`, etc.) require:

1. `NEXT_PUBLIC_GA_MEASUREMENT_ID` configured
2. User consent = `granted` in `localStorage` (`vibe-analytics-consent`)

Server-side Measurement Protocol (purchase/refund) remains server-only and is not gated by the browser banner.

## L-30 — Compliance on production

Set on VPS / production env:

```bash
NEXT_PUBLIC_LEGAL_ENTITY_NAME="Your Registered Entity Pvt Ltd"
NEXT_PUBLIC_GSTIN="22AAAAA0000A1Z5"
```

Verify after deploy:

```bash
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
```

`REQUIRE_COMPLIANCE=true` fails if legal entity or GSTIN is missing from live homepage HTML.

## Synthetic checkout monitor

Runs every 5–15 minutes via cron or GitHub Actions `workflow_dispatch`:

```bash
VERIFY_BASE_URL=https://vibemusic.in npm run monitor:checkout
```

Checks: health, capabilities, checkout page, empty-cart rejection, tampered-price rejection, invalid coupon, catalog sample.

**Example cron (VPS):**

```cron
*/15 * * * * cd /root/Vibe-music && VERIFY_BASE_URL=https://vibemusic.in npm run monitor:checkout >> /var/log/vibe-checkout-monitor.log 2>&1
```

## Operator checklist

```bash
npm run check:env                    # L-30 GSTIN warning for vibemusic.in
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
VERIFY_BASE_URL=https://vibemusic.in npm run monitor:checkout
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
```

## Phase 6 score

- **Compliance & monitoring (code):** 9/10
- **Live L-30 on vibemusic.in:** pending env + deploy
- **Production edge:** 5/10 (L-22 unchanged)

**Phase 7 complete** — see `PHASE7_PRODUCTION_CERTIFICATION.md` and `PRODUCTION_READINESS_SCORECARD.md`.

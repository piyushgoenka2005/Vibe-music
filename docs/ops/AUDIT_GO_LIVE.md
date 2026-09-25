# Audit go-live checklist (L-01 – L-30)

Complete after deploying latest `main` to production.

## Critical (must pass before accepting payments)

| ID   | Check                                  | Command                                                   |
| ---- | -------------------------------------- | --------------------------------------------------------- |
| L-15 | Checkout recomputes prices server-side | E2E `audit-fixes.spec.ts` tamper test                     |
| L-19 | Orders scoped to `userId`              | Unit `orderRepository.test.ts`                            |
| L-22 | CDN/WAF in front of origin             | `VERIFY_BASE_URL=https://vibemusic.in npm run check:edge` |
| L-26 | Checkout E2E in CI                     | `npm run test:e2e` (CI)                                   |

## High security

| ID   | Check               | Command                                           |
| ---- | ------------------- | ------------------------------------------------- |
| L-16 | Security headers    | `VERIFY_BASE_URL=... npm run verify:prod-signoff` |
| L-17 | Rate limits         | Covered by `src/proxy.ts` + route limits          |
| L-20 | Dependency audit    | `npm run audit:deps`                              |
| L-21 | Webhook signatures  | `src/lib/razorpay/signature.test.ts`              |
| L-23 | Origin IP protected | Follow `ORIGIN_IP_PROTECTION.md` after Cloudflare |
| L-24 | Inventory locks     | `FOR UPDATE` in `inventoryRepository.ts`          |

## Performance & UX

| ID   | Check                  | Command                              |
| ---- | ---------------------- | ------------------------------------ |
| L-07 | Search autosuggest     | E2E header overlay test              |
| L-11 | Homepage lazy sections | Visual check mobile homepage         |
| L-14 | CWV baseline           | `npm run check:cwv` (server running) |

## Compliance & ops

| ID   | Action                                                                      |
| ---- | --------------------------------------------------------------------------- |
| L-30 | Set `NEXT_PUBLIC_LEGAL_ENTITY_NAME`, `NEXT_PUBLIC_GSTIN` on VPS             |
| L-04 | Optional: `NEXT_PUBLIC_CRISP_WEBSITE_ID` for live chat                      |
| L-28 | Quarterly restore drill per `DISASTER_RECOVERY.md`                          |
| L-25 | Before sales: `k6 run -e BASE_URL=https://vibemusic.in scripts/k6/smoke.js` |

## One-shot production sign-off

**On the VPS (recommended):**

```bash
cp deploy/ops-secrets.env.example deploy/ops-secrets.env
# Edit: GSTIN, legal entity, GA4, phone
sudo bash deploy/complete-audit-go-live.sh
# After Cloudflare proxied DNS is live:
sudo CLOUDFLARE_ONLY=1 bash deploy/complete-audit-go-live.sh
```

**From CI / dev machine:**

```bash
VERIFY_BASE_URL=https://vibemusic.in npm run release:ready
```

Set `REQUIRE_CDN_EDGE=true` once Cloudflare is active to make CDN a blocking gate.

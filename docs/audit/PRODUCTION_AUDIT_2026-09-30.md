# Production audit — 30 Sep 2026

Deep audit of Vibe Music as a musical-instruments ecommerce platform. This document supersedes stale counts in older certification notes.

**Machine-readable:** `docs/audit/vibemusic_audit.json`  
**Interactive summary:** `canvases/vibe-music-production-audit.canvas.tsx`  
**Remediation tracker:** `docs/AUDIT_REMEDIATION_SCORECARD.md`

---

## Honest scores

| Lens                  |         Score | Notes                                                            |
| --------------------- | ------------: | ---------------------------------------------------------------- |
| **Overall composite** |  **7.8 / 10** | Strong D2C store; not enterprise catalog ops                     |
| Payments & checkout   |           9.0 | Server pricing, Razorpay HMAC, amount verify                     |
| Security & auth       |       **8.0** | Upstash required in prod; admin upload hardened                  |
| API design & coverage | 6.2 → **6.8** | 183 routes; route tests added for refund/shipment/import/rentals |
| Testing               | 7.0 → **7.2** | 681+ unit, 173+ E2E after this pass                              |
| Production live       |         17/20 | Pending Cloudflare edge, UFW, GSTIN on live                      |

**Repository CI certification (L-01–L-30)** remains valid for code gates. **“10/10 repo”** means audit checklist pass — not zero engineering debt.

---

## Completed in this audit pass (P0 + P1)

| Item                                                                                 | Status |
| ------------------------------------------------------------------------------------ | ------ |
| Require `UPSTASH_REDIS_REST_*` in production (`env.ts` + `productionSecurityGuards`) | Done   |
| Wire `assertProductionSecurityControls()` at startup (`instrumentation.ts`)          | Done   |
| Admin upload: 10MB cap + magic-byte sniff (product/blog/banner)                      | Done   |
| Shared `imageUploadValidation.ts` (admin + review uploads)                           | Done   |
| Route tests: admin refund, shipment, bulk import confirm, rental verify-payment      | Done   |
| E2E: CSRF 403 on mutation without Origin; webhook missing signature                  | Done   |
| Canvas audit artifact (fixed TypeScript)                                             | Done   |
| Sentry SDK + errorMonitoring capture when `SENTRY_DSN` set                           | Done   |
| Route tests: resume-payment, auth/register                                           | Done   |
| Post-deploy smoke: CSRF 403 + webhook 400 checks                                     | Done   |

---

## Still open (P2–P3)

### P2 — Scale (2–3 months)

- Meilisearch/Typesense for typo-tolerant search
- Normalized `ProductVariant` + `OrderItem` tables
- Persisted cart + abandoned-cart email worker
- Repository integration tests (orders, inventory, rentals)
- Component tests for checkout, PDP gallery, admin forms
- Sentry SDK + OpenTelemetry on payment/import paths

### P3 — 10/10 instruments platform

- Serial/warranty registry, trade-in pipeline, B2B pricing
- Multi-warehouse + store pickup, EMI UX, gift cards
- Marketplace export feeds, pro quote workflow
- k6 load at 50k SKUs, API `/v1` versioning

### Operator (production live)

```bash
cd /root/Vibe-music && git pull origin main && bash deploy/update.sh
VERIFY_BASE_URL=https://vibemusic.in npm run check:edge
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
BASE_URL=https://vibemusic.in bash deploy/post-deploy-smoke.sh
```

Set on VPS `.env`:

- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_GSTIN` + `NEXT_PUBLIC_LEGAL_ENTITY_NAME`

---

## Test counts (verify with `npm test` / Playwright)

| Layer                            |   Count |
| -------------------------------- | ------: |
| Unit (Vitest)                    |     697 |
| E2E (Playwright)                 |    173+ |
| Route tests (`**/route.test.ts`) |      29 |
| Integration                      | 2 files |
| Component                        | 2 files |

Run: `npm test`, `npm run test:e2e -- e2e/security-hardening.spec.ts`

---

## API coverage snapshot

| Domain     | Routes (approx) |                     Route-tested |
| ---------- | --------------: | -------------------------------: |
| Admin      |              90 | ~3% (+ refund, shipment, import) |
| Payment    |               5 |                             ~80% |
| Rentals    |              11 |           verify-payment covered |
| Storefront |              93 |                             ~15% |

Target for next pass: admin coupon/inventory routes, `orders/resume-payment`, `auth/register`.

---

## Musical-instruments gaps (unchanged)

Present: guitar specs, 360° gallery, rentals, compare, bulk import (12 images), notify-me.

Missing for world-class: normalized variants, serial/warranty, trade-in workflow, B2B tiers, multi-warehouse, abandoned cart, gift cards, marketplace feeds, international shipping beyond India GST.

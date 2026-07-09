# Test Report

**Date:** 9 July 2026

## Automated test results

| Suite | Command | Result |
|-------|---------|--------|
| TypeScript | `npm run type-check` | **PASS** |
| ESLint | `npm run lint` | **PASS** (0 errors, 52 warnings) |
| Unit / integration | `npm test` (Vitest) | **PASS** — 50/50 tests |
| Production build | `npm run build` | **PASS** |

## Test files (10)

| File | Tests | Area |
|------|-------|------|
| `gstCalculator` — via gap-closure | 5 | Invoice tokens, integrations |
| `orderId.test.ts` | 5 | Order ID formatting |
| `signature.test.ts` | 5 | Razorpay HMAC |
| `mutation-origin.test.ts` | 3 | CSRF origin |
| `couponMath.test.ts` | 5 | Coupon allocation |
| `categorySlug.test.ts` | 6 | URL slugs |
| `stockMath.test.ts` | 9 | Inventory math |
| `variants.test.ts` | 3 | Variant resolution |
| `integrationConfig.test.ts` | 2 | Env integration |
| `guitarShowcaseSpecs.test.ts` | 7 | PDP specs |

## Gaps

| Missing test coverage | Priority |
|---------------------|----------|
| `calculateGST()` unit tests | P2 |
| Contact API integration test | P2 |
| Invoice HTML snapshot tests | P2 |
| Playwright E2E (checkout, admin) | P1 |
| Lighthouse CI | P2 |

## Manual QA recommended

1. Contact form submit → Firestore `contactMessages` + email
2. Admin audit logs page (super_admin only)
3. Checkout mobile bar on iOS Safari
4. Invoice PDF download with Playwright installed

## Production readiness (testing)

**Score: 70/100** — Core math/security covered; E2E and GST tests missing.

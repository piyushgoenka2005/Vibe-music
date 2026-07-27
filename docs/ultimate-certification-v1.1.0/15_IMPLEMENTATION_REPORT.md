# 15 — Implementation Report

## Scope

Ultimate zero-trust pass: discover → classify → implement VERIFIED issues only → validate → certify.

## Features confirmed complete (no rebuild)

Admin + storefront CRUD/workflows already present (38 admin pages, 81 admin APIs). This pass **did not redesign** modules.

## Code changes implemented

### Security

| Change | Files |
|--------|-------|
| OAuth dangerous linking opt-in | `src/auth.ts`, `.env.example` |
| Admin Zod → 400 | `src/lib/auth/require-admin.ts` |
| Hardened HTML sanitizer + tests | `src/lib/security/sanitize.ts`, `sanitize.test.ts` |
| Public API error helper | `src/lib/server/publicApiError.ts` |
| Wired to rentals/giveaway/addresses | API routes |
| Refund message allowlist | `api/admin/orders/[id]/refund/route.ts` |

### Product / UX consistency

| Change | Files |
|--------|-------|
| Free shipping cart default 0 | `cartPromotions.ts`, `cartShipping.ts`, `cartMilestones.ts` |
| Milestone test for threshold 0 | `cartMilestones.test.ts` |
| Lock misleading admin shipping fields | `admin/settings/page.tsx` |

### Data / performance

| Change | Files |
|--------|-------|
| Bound paid-order fetch | `orderRepository.ts` |
| Catalog scripts write catalog only | `sync-review-ratings.mts`, `clean-product-names.mts` |
| Sync root `products.json` from catalog | filesystem copy |

### Prior RC / admin completion (already in working tree)

Admin error/retry UI, MutationError, permission gating, Zod on former manual admin mutations — preserved and included in certification.

## Not implemented (explicit)

| Item | Reason |
|------|--------|
| Order.userId FK migration | Risk to guest/orphan rows; needs data cleanup |
| Full DOMPurify dependency | Hardened sanitizer shipped; optional upgrade |
| JWT admin claim TTL redesign | Mitigated by `/api/admin/me` |
| Big Names asset renames | Cosmetic Low |
| Full API error.message sweep | Key high-traffic routes done; remainder tracked |
| New Playwright CRUD suite | Out of scope (no new features); smoke suite passes |

# Admin Test Report — v1.1.0

**Commit:** `2f3d552`  
**Run date:** 2026-07-27

## Automated runs

| Gate | Command | Result | Evidence |
|------|---------|--------|----------|
| TypeScript | `npm run type-check` | **PASS** | 0 errors |
| ESLint | `npm run lint` | **PASS** (warnings) | 0 errors, 41 warnings (mostly pre-existing storefront) |
| Vitest | `npm run test` | **PASS** | 35 files, 155 tests |
| Production build | `npm run build` | **FAIL** | `DATABASE_URL is required for catalog reads` during `/category/[slug]` page data collection |
| Playwright admin | `npx playwright test e2e/admin.spec.ts` | **PARTIAL** | 2/5 passed (API auth tests); 3 UI tests failed — Chromium not installed |

### Vitest admin-related

| Test file | Tests | Status |
|-----------|-------|--------|
| `src/lib/auth/admin-route-permissions.test.ts` | 3 | pass |
| `src/lib/validations/admin-bulk.test.ts` | 3 | pass |

### Playwright

| Spec | Tests | Status | Notes |
|------|-------|--------|-------|
| `e2e/admin.spec.ts` | login load | **SKIP/FAIL** | `npx playwright install` required |
| `e2e/admin.spec.ts` | unauth redirects | **SKIP/FAIL** | same |
| `e2e/admin.spec.ts` | API 401 compare analytics | **PASS** | 430ms |
| `e2e/admin.spec.ts` | API 401 rental analytics | **PASS** | 144ms |
| `e2e/admin.authenticated.spec.ts` | dashboard | conditional | Requires `DATABASE_URL` + E2E admin seed |

E2E global setup: admin seed failed — `Authentication failed against database server` for configured `vibe` user.

## Manual verification checklist (code review)

| Area | Status |
|------|--------|
| All admin pages have data fetching | ✓ |
| Error vs empty distinction (post-program) | ✓ 25+ pages updated |
| Mutation error feedback (post-program) | ✓ orders, settings, inventory, reviews, etc. |
| Permission UI gating categories/brands/coupons/banners/homepage | ✓ |
| AdminGuard path permissions | ✓ |
| API requireAdmin coverage | ✓ 81/81 |

## Recommended follow-up tests

1. `npx playwright install` then re-run `e2e/admin.spec.ts` and `e2e/admin.authenticated.spec.ts` with valid `DATABASE_URL`.
2. CI build with production `DATABASE_URL` or mock catalog for static generation.
3. Expand Playwright: products CRUD smoke, role switching, coupon create/delete.

## Coverage gaps

- No dedicated Playwright suite for full CRUD per entity.
- No automated visual regression for admin.
- Authenticated admin workflows not executed in this environment (DB + browser).

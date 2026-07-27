# Admin Security Certification — RC-1

**Date:** 2026-07-27  
**Method:** Static code verification + Playwright auth smoke tests

---

## Control matrix

| Control | Implementation | Verified |
|---------|----------------|----------|
| API authentication | `requireAdmin()` on 81/81 admin routes | ✓ grep |
| Permission on mutations | Per-route permission strings | ✓ |
| UI route guard | `AdminGuard` + `canAccessAdminPath` | ✓ |
| Sidebar filtering | `NAV_ITEMS` + `hasPermission` | ✓ |
| Write UI gating | categories, brands, coupons, banners, homepage | ✓ code |
| CSRF / origin | `proxy.ts`, `mutation-origin.ts` | ✓ |
| Rate limiting | `proxy.ts` admin paths | ✓ |
| Audit on mutations | `requireAdmin` logs + domain audit events | ✓ |
| Session rejection | Playwright logs `session_rejected` | ✓ E2E |
| Upload MIME | Zod `adminImageMimeTypeSchema` + handlers | ✓ RC-1 |
| Generic 500 on admin errors | `adminErrorResponse` no leak | ✓ |

---

## RBAC verification

- **Route map:** `src/lib/auth/admin-route-permissions.ts` (longest-prefix).
- **Permission enum:** `src/lib/auth/permissions.ts` + `ROLE_PERMISSIONS`.
- **Unauthorized UI:** Access denied panel in `AdminGuard` — no silent bypass found.
- **API 401/403:** Playwright API tests confirm unauthenticated analytics endpoints reject.

---

## Upload security

| Endpoint | Checks |
|----------|--------|
| `upload/images` | `products:write`, max 20 files, image MIME Zod, CDN folder from slug schema |
| `upload/blog-image` | `blog:write`, image MIME |
| `upload/banner-image` | `banners:write`, image MIME |
| `upload/images/delete` | Existing `adminDeleteImagesSchema` (pre-RC) |

---

## OAuth / storefront (admin boundary)

Admin uses **credentials/session** via Auth.js (`getSessionUser` → `getAdminSession`). Storefront Google OAuth (`src/auth.ts`) does not grant admin access without `AdminProfile` + role permissions.

**Platform note:** `allowDangerousEmailAccountLinking` remains a storefront OAuth risk — documented in enterprise DD, not admin-specific.

---

## Headers / cookies

- Admin session: Auth.js cookies (handled by NextAuth adapter).
- `adminErrorResponse` sets `x-request-id` when request provided.
- Security event logging on rejected sessions (Playwright evidence).

---

## Findings

| ID | Severity | Status |
|----|----------|--------|
| SEC-RC-01 | — | 9 manual validation routes → **resolved** (VALIDATION_COMPLETION.md) |
| SEC-RC-02 | Low | Zod failures still map to 500 via `adminErrorResponse` (pre-existing) |
| SEC-RC-03 | Info | CMS/shipping require `settings:write` for page access (intentional) |

---

## Certification status

**No permission bypass identified.** Admin security certification: **PASS** for RC-1 scope.

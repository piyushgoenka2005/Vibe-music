# Admin Security Report — v1.1.0

**Scope:** Admin panel UI, `src/app/api/admin/**`, auth middleware, edge proxy.

## Summary

Admin mutations are authenticated and permission-scoped. No permission bypass found in static audit. Residual risks are environmental and validation-depth (Zod gaps on a handful of routes).

## Controls verified

| Control | Implementation | Status |
|---------|----------------|--------|
| Authentication | NextAuth session + `requireAdmin()` | ✓ |
| RBAC | `permissions.ts`, per-route permission strings | ✓ |
| UI route guard | `AdminGuard` + `canAccessAdminPath` | ✓ |
| Sidebar filtering | Permission per nav item | ✓ |
| CSRF / origin | `proxy.ts`, mutation origin checks | ✓ |
| Rate limiting | `proxy.ts` admin paths | ✓ |
| Audit trail | Audit log service on admin mutations | ✓ |
| IDOR (orders/customers) | Server-side ID + admin permission | ✓ |
| Session expiry | 401 on `/api/admin/me` → login redirect | ✓ |
| Upload endpoints | Admin-only; MIME/size in upload handlers | ✓ (review MIME allowlist in ops) |
| Secrets in client | Admin pages fetch via relative `/api/admin/*` | ✓ |

## UI permission gating (post-completion)

Write/delete controls hidden without matching permission on:

- Categories, brands (`categories:write/delete`)
- Coupons (`coupons:write/delete`)
- Banners (`banners:write/delete`)
- Homepage curator (`homepage:write`)

API already rejected unauthorized mutations; UI now aligns (defense in depth).

## Findings

| ID | Severity | Finding | Evidence | Recommendation |
|----|----------|---------|----------|----------------|
| SEC-01 | Medium | 9 mutation routes use manual validation instead of Zod | See `ADMIN_API_MATRIX.md` | Add Zod schemas for consistent 400 responses |
| SEC-02 | Low | ESLint warnings on `<img>` in admin upload preview | `ProductImageUpload.tsx` | Optional: migrate to `next/image` |
| SEC-03 | Info | CMS/shipping require `settings:write` for page access (not `settings:read`) | `admin-route-permissions.ts` | Intentional; document for role designers |
| SEC-04 | Info | `allowDangerousEmailAccountLinking` in storefront auth | `src/auth.ts` | Out of admin scope; track for storefront |

## Not verified in this environment

- Live penetration test
- Production cookie flags (assumed via NextAuth defaults + proxy)
- WAF / CDN rules

## Mutation protection matrix

| Action type | Protected by |
|-------------|------------|
| All `/api/admin/*` | `requireAdmin` |
| Product delete | `products:delete` + confirm dialog |
| Customer erase | `customers:write` + confirm |
| Order refund | `orders:write` + confirm |
| Admin invite | `admins:write` |

**Verdict:** No critical admin authorization bypass identified in repository review.

# SECURITY REPORT

**Date:** June 12, 2026  
**Scope:** Admin system implementation + related security fixes

---

## Issues Resolved

| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| SEC-01 | Critical | Open admin product write API | All `/api/admin/*` routes use `requireAdmin()` |
| SEC-02 | Critical | Any user could access admin UI | `AdminGuard` checks `admins` collection via `/api/admin/me` |
| SEC-03 | Critical | Client-controlled checkout prices | `resolveOrderItemsFromFirestore()` in create-order |
| SEC-04 | Critical | Order IDOR without session | `GET /api/orders/[orderId]` requires auth + ownership or admin |
| SEC-05 | High | Client-supplied coupon discount | `resolveCouponDiscount()` validates against Firestore |
| SEC-06 | High | Minimal Firestore rules | Expanded rules for all collections |
| SEC-07 | High | No admin/customer separation | Dedicated `/admin/login` with role gate |

## Current Security Architecture

### Authentication
- Firebase Auth + HTTP-only session cookies (5-day)
- Admin profiles in separate `admins` collection (not `users.role`)

### Authorization
- Server-side: `requireAdmin(permission?)` on every admin API
- Client-side: `AdminGuard` redirects non-admins to `/admin/login`
- Middleware: Session cookie required for `/admin/*` (except login)

### Data Access
- All admin writes via Firebase Admin SDK (bypasses rules)
- Client Firestore: owner-only on `users`; read-only on `products`, `categories`, approved `reviews`
- Admin collection: deny all client access

### Validation
- Zod schemas in `src/lib/validations/admin.ts` for all admin mutations
- Checkout re-validates prices and coupons server-side

## Firestore Rules Summary

| Collection | Client Read | Client Write |
|------------|-------------|--------------|
| users | Owner only | Owner only |
| admins | Deny | Deny |
| products | Public | Deny |
| categories | Public | Deny |
| orders | Deny | Deny |
| coupons | Deny | Deny |
| reviews | Approved only | Deny |
| settings/store | Public read | Deny |
| inventory_adjustments | Deny | Deny |

Deploy with: `firebase deploy --only firestore:rules`

## Remaining Risks

| ID | Severity | Issue | Recommendation |
|----|----------|-------|----------------|
| R-01 | Medium | Middleware checks cookie presence, not validity | Verify session in middleware for `/admin/*` |
| R-02 | Medium | No rate limiting on APIs | Add Upstash Redis rate limiting |
| R-03 | Medium | No Firebase Storage rules | Add before image upload feature |
| R-04 | Medium | Admin seed via CLI only | Build admin user management UI |
| R-05 | Low | Guest order tracking uses orderId + email | Add rate limiting; consider signed tokens |
| R-06 | Low | No MFA for admin accounts | Enable Firebase MFA for admin emails |
| R-07 | Low | Razorpay webhook not implemented | Add signed webhook handler |
| R-08 | Low | Product PDP uses static data | Unify on Firestore to prevent stale admin edits |

## Security Checklist for Production

- [ ] Deploy updated Firestore rules
- [ ] Seed Super Admin with strong password
- [ ] Set all Firebase env vars in production
- [ ] Restrict Firebase Admin SDK key to server only
- [ ] Enable Firebase App Check
- [ ] Configure CORS if admin on separate domain
- [ ] Audit Firebase Auth users — remove test accounts
- [ ] Enable Vercel deployment protection for preview URLs

---

*Prior audit: ADMIN_AUDIT_REPORT.md*

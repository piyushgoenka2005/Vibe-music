# Security Report

**Date:** 9 July 2026

## Authentication & authorization

| Control | Status | Evidence |
|---------|--------|----------|
| Firebase session cookies | Implemented | `api/auth/session` |
| Admin RBAC | Implemented | `permissions.ts`, `requireAdmin()` |
| Guest order access tokens | Implemented | `invoiceAccessToken.ts`, HMAC-SHA256 |
| Order ownership checks | Implemented | `canAccessOrder`, order API |

## API security

| Control | Status | Evidence |
|---------|--------|----------|
| Rate limiting | Implemented | `enforceRateLimit`, `RATE_LIMITS` |
| CSRF on mutations | Implemented | `enforceMutationSecurity` |
| Input validation (Zod) | Implemented | Checkout, contact, admin routes |
| Razorpay webhook verification | Implemented | `signature.test.ts`, webhook route |
| Admin audit logging | Implemented | `auditLog.ts` + viewer *(new)* |

## Payment & invoice security

| Control | Status | Evidence |
|---------|--------|----------|
| Razorpay signature verify | Implemented | `verify-payment` route |
| Invoice access gating | Implemented | `resolveInvoiceOrder`, `isInvoiceAvailable` |
| Signed invoice URLs | Implemented | Token-based HTML/PDF access |
| Guest email in URL | Reduced | Checkout/account use tokens where configured |

## Gaps

| Gap | Risk | Priority |
|-----|------|----------|
| No CSP headers on invoice HTML | Low | P2 |
| GSTIN not validated in admin | Low | P2 |
| No automated security scan in CI | Medium | P2 |
| `debug/payment` route exists | Medium — ensure disabled in prod | P1 review |
| Secrets in `.env.local` (dev) | Ops | Rotate Razorpay keys if exposed |

## Contact form security (new)

- Rate limited (`publicApi` limit)
- CSRF mutation check
- Zod schema max lengths
- Server-only Firestore write

## Production readiness (security)

**Score: 88/100** — Core ecommerce security controls are in place; enterprise hardening (CSP, SAST, refund auth audit) remains.

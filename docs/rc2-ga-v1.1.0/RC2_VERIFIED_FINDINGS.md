# RC-2 Verified Findings

**Program:** ViBE Music v1.1.0 — RC-2 → GA  
**Date:** 28 July 2026  
**Baseline audit:** `docs/release/FINAL_ALL_TYPE_AUDIT_REPORT.md` (commit `7e6c3b1`)  
**Method:** Source-code verification only (no assumption carry-forward)

---

## Classification legend

| Class | Meaning |
|-------|---------|
| VERIFIED | Confirmed present in source at start of RC-2; remediating |
| ALREADY FIXED | Prior claim; confirmed still correct in source |
| FALSE POSITIVE | Audit claim not supported by current source |
| NOT APPLICABLE | Outside product scope / accepted product constraint |

---

## Security

| ID | Finding | Class | Evidence |
|----|---------|-------|----------|
| C0 | Critical vulnerabilities | ALREADY FIXED | No critical issues confirmed in auth, payments, admin RBAC, webhook HMAC |
| H1 | Guest orders auto-linked on register/login (IDOR) | VERIFIED → FIXED in RC-2 | Was: `linkGuestOrdersToUser` + auth sign-in. Now: `linkGuestOrdersToUser` returns `0`; auth `events.signIn` does not link; `attachPaidOrderToUser` only on paid verify with email match (`orderRepository.ts`, `auth.ts`, `verify-payment/route.ts`) |
| M1 | Rate-limit IP uses first `X-Forwarded-For` hop | VERIFIED → FIXED | `getClientIp` prefers `X-Real-IP`, else rightmost trusted hop via `TRUST_PROXY_HOPS` (`rate-limit-core.ts` + tests) |
| M2 | Password-reset tokens stored plaintext | VERIFIED → FIXED | SHA-256 hash stored; raw token only in email (`password-reset-token.ts`, forgot/reset routes) |
| M3 | Regex HTML sanitizer + CSP `unsafe-eval` / `unsafe-inline` | VERIFIED (partial) | `unsafe-eval` removed from CSP; sanitizer strengthened; `unsafe-inline` retained for Razorpay/inline needs; DOMPurify not adopted (residual MED) |
| L1 | Admin upload MIME `image/*` | VERIFIED (accepted) | Sharp→WebP pipeline mitigates; not changed in RC-2 |
| L2 | `/api/media/thumb` cost/DoS surface | VERIFIED (accepted) | Dedicated rate bucket `mediaThumb` exists |
| L3 | Health may surface DB error strings | VERIFIED (accepted) | Observability trade-off; not security-critical |
| L4 | Some admin mutations skip audit `request` | VERIFIED (accepted) | Observability only |

### Strong controls re-verified

| Control | Class | Evidence |
|---------|-------|----------|
| Razorpay webhook HMAC | ALREADY FIXED | `razorpay/signature.ts`, webhook service |
| Demo payments blocked in production | ALREADY FIXED | `env.ts` rejects `ALLOW_DEMO_PAYMENTS` in production |
| CSRF / origin guard | ALREADY FIXED | `enforceMutationSecurity` / `proxy.ts` |
| Admin APIs require auth | ALREADY FIXED | Admin route permissions |
| Invoice / order access without email-alone in prod | ALREADY FIXED | `orderAccess.ts` |
| Server-side checkout price resolution | ALREADY FIXED | Checkout services |

---

## Reliability / inventory

| ID | Finding | Class | Evidence |
|----|---------|-------|----------|
| R1 | Async reserve after returning Razorpay credentials | VERIFIED → FIXED | `createOrder` awaits `reserveStockForOrder` before return; rolls back order on failure (`orderService.ts`) |
| R2 | No row locks on stock | VERIFIED → FIXED | `SELECT … FOR UPDATE` on product ids inside reservation transaction (`inventoryRepository.ts`) |
| R3 | No TTL for abandoned reservations | VERIFIED → FIXED | `scripts/ops/release-stale-reservations.mts` + `ops:release-stale-reservations` + crontab example |
| R4 | Payment completion idempotent | ALREADY FIXED | `completeOrderPayment` skips `already_paid` (`orderPaymentService.ts`) |
| R5 | Confirmation email fire-and-forget | VERIFIED (accepted SHOULD) | Non-blocking by design; documented residual |

---

## Database / API / Performance / Ops

| ID | Finding | Class | Notes |
|----|---------|-------|-------|
| D1 | Catalog/order indexes present | ALREADY FIXED | `prisma/schema.prisma` indexes on status, email, razorpayOrderId, etc. |
| D2 | No dedicated `inventoryStatus` index | VERIFIED (accepted residual) | Sweeper volume low (`take: 200`); migration deferred |
| A1 | Zod validation on mutation routes | ALREADY FIXED | Checkout/auth/admin schemas |
| P1 | Soft Lighthouse / a11y CI gates | VERIFIED (accepted) | Not hard-blocking GA |
| O1 | Backups + verify script | ALREADY FIXED | `deploy/verify-backups.sh`, crontab example |
| O2 | Single PM2 instance | NOT APPLICABLE as defect | Accepted scale posture |
| O3 | Razorpay-only payments | NOT APPLICABLE | Product constraint |

---

## Summary counts (post RC-2 remediation)

| Class | Count |
|-------|------:|
| VERIFIED High fixed | 1 |
| VERIFIED Reliability MUST fixed | 3 |
| VERIFIED Medium fixed / partial | 3 (M3 partial) |
| Accepted residuals (L/SHOULD/product) | 8+ |
| Critical remaining | **0** |
| High remaining | **0** |

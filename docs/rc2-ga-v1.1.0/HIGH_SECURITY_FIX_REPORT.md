# High Security Fix Report

**Program:** ViBE Music v1.1.0 — RC-2 → GA  
**Date:** 28 July 2026  
**Scope:** VERIFIED High severity only

---

## H1 — Guest order auto-claim IDOR (FIXED)

### Pre-fix behavior (verified)

1. Guest checkout created orders with `userId = null` and checkout email.
2. On credentials/Google sign-in, `linkGuestOrdersToUser(userId, email)` bulk-attached **all** matching guest orders.
3. Registration does not require email verification.
4. `canAccessOrder` grants access when `order.userId === context.userId`.

**Impact:** Attacker registers victim’s guest-checkout email → gains order PII (address, phone, invoice).

### Post-fix behavior

| Control | Implementation |
|---------|----------------|
| Disable bulk link | `linkGuestOrdersToUser` returns `0` (no DB writes) |
| Remove auth hook | `src/auth.ts` sign-in/events no longer call guest linking |
| Paid-order attach only | `attachPaidOrderToUser(orderId, userId, email)` |
| Email match required | Normalized email must equal order email |
| Ownership race-safe | `updateMany` where `id` + `userId: null` |
| Refuse reassignment | Existing different `userId` → no-op |
| Payment-path only | Called from `verify-payment` and `demo` after/around payment completion |

### Access model (verified)

- Authenticated owner: `order.userId === session userId`
- Guest: HMAC/tracking token via `verifyOrderTrackingToken`
- Production: email-alone access **denied** (`orderAccess.ts`)
- Register route: no order linking

### Guest → registered migration

Allowed **only** when:

1. Order is paid (or payment completion path), and
2. Session email cryptographically/session-bound matches order email, and
3. Order still has `userId = null`

Not allowed: login/register claiming historical guest orders by email alone.

### Residual risk

- If an attacker already controls the inbox used at checkout **and** completes payment while logged in as that email, attach is intentional (email ownership of the paid session).
- Pre-existing guest orders remain unattached until tracking token or future explicit claim flow (not built — out of RC-2 feature freeze).

### Verdict

**HIGH severity H1: FIXED.** No remaining VERIFIED High issues.

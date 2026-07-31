# Reliability Certification

**Program:** ViBE Music v1.1.0 — RC-2 → GA  
**Date:** 28 July 2026  
**Priority:** Highest after security

---

## Inventory reservation (FIXED)

| Requirement | Evidence |
|-------------|----------|
| Reserve before payment UI credentials | `createOrder` awaits `reserveStockForOrder` then returns Razorpay/demo credentials |
| Failure rolls back order | On reserve error: `releaseOrderReservation` + `removeOrder` |
| Idempotent reserve | Status `reserved`/`fulfilled` short-circuits |
| Pessimistic locking | `SELECT id FROM products WHERE id IN (…) FOR UPDATE` inside transaction |
| Atomic reservedStock increment | Same Prisma transaction as validation |
| Oversell prevention | Availability validated under row locks |

## Reservation TTL / cleanup (FIXED)

| Item | Evidence |
|------|----------|
| Sweeper script | `scripts/ops/release-stale-reservations.mts` |
| npm script | `ops:release-stale-reservations` |
| Default TTL | 45 minutes (`RESERVATION_TTL_MINUTES`) |
| Selection | `inventoryStatus=reserved`, `paymentStatus in (pending,failed)`, `updatedAt < cutoff` |
| Cron example | `deploy/crontab.backups.example` every 15 minutes |

**Ops condition:** Install sweeper cron on VPS after deploy (documented).

## Payment / checkout atomicity

| Concern | Status | Evidence |
|---------|--------|----------|
| Double payment completion | Protected | `completeOrderPayment` returns `already_paid` |
| Webhook + client verify race | Protected | Same idempotent completion path |
| Duplicate checkout oversell | Hardened | Row locks + pre-credential reserve |
| Order create rollback | Protected | Catch path releases reservation + deletes order |

## Explicitly accepted residuals

| Item | Rationale |
|------|-----------|
| Confirmation email `void` send | Non-blocking UX; SMTP failures monitored operationally |
| No compound DB index on `inventoryStatus` | Low sweeper cardinality; deferred migration |
| Concurrent checkout load test not simulated in CI | Unit + lock semantics cover; load test optional SRE follow-up |

## Verdict

All VERIFIED MUST reliability issues are **resolved**. Remaining items are accepted SHOULD/ops install steps.

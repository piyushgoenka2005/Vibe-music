# 03 — Reliability Final

See also: `RELIABILITY_CERTIFICATION.md`.

| MUST item | Status |
|-----------|--------|
| Await inventory reserve before payment credentials | **FIXED** |
| Pessimistic product row locks (`FOR UPDATE`) | **FIXED** |
| Reservation TTL sweeper | **FIXED** (cron install = ops condition) |
| Payment completion idempotency | ALREADY FIXED |
| Checkout Zod COD rejection message | FIXED (API clarity) |

**Reliability domain score: 90 / A-** (A after VPS sweeper cron confirmed)

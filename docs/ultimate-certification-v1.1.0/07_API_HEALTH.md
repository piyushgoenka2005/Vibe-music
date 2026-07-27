# 07 — API Health

**Score: 84/100**

## Inventory

| Surface | Count |
|---------|------:|
| Total API routes | ~164 |
| Admin API routes | 81 |
| Admin `requireAdmin` | 81/81 |

## Improvements this pass

- Admin Zod → 400 via `adminErrorResponse`.
- `publicApiError` on rentals booking/quote, giveaway entries, addresses.
- Admin refund allowlisted messages.
- RC Zod on newsletter DELETE, product duplicate, rental DELETEs, uploads.

## Residual

- Some storefront routes still use ad-hoc `error.message` returns (partial migration).
- Idempotency keys not universal on all mutations (payment paths have stronger guarantees).

## Auth smoke (Playwright)

- `/api/admin/compare/analytics` → ≥401 ✓  
- `/api/admin/rentals/analytics` → ≥401 ✓

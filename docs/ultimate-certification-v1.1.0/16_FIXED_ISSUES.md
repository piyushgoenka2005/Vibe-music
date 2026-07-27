# 16 — Fixed Issues

| ID | Prior claim | Classification | Resolution |
|----|-------------|----------------|------------|
| F-01 | `allowDangerousEmailAccountLinking: true` | VERIFIED → **FIXED** | Opt-in via `AUTH_ALLOW_DANGEROUS_EMAIL_LINKING` |
| F-02 | Regex sanitizer weak | VERIFIED → **HARDENED** | Expanded tags/handlers/protocols + tests |
| F-03 | Admin Zod → 500 | VERIFIED → **FIXED** | `ZodError` → 400 in `adminErrorResponse` |
| F-04 | API error.message leaks | VERIFIED → **PARTIALLY FIXED** | `publicApiError` on key routes |
| F-05 | Admin refund leaks messages | VERIFIED → **FIXED** | Allowlisted client messages |
| F-06 | Dual products.json drift | VERIFIED → **FIXED** | Synced + scripts catalog-only |
| F-07 | Cart free-shipping messaging vs checkout | VERIFIED → **FIXED** | Default threshold 0 |
| F-08 | Admin shipping fields misleading | VERIFIED → **FIXED** | Disabled + note |
| F-09 | Unbounded `findPaidOrders` | VERIFIED → **FIXED** | 90-day window + take 5000 |
| F-10 | Manual admin validation routes | ALREADY FIXED (RC) | Confirmed Zod present |
| F-11 | Fake reviews/discounts | ALREADY FIXED | Confirmed |
| F-12 | Invoice email-only / webhook HMAC / CSRF | ALREADY FIXED | Confirmed |
| F-13 | Orphan admin APIs | FALSE POSITIVE | Confirmed wired |
| F-14 | TODO stubs blocking ship | NOT APPLICABLE | HTML placeholders only |

## False positives / do not reopen

- “No middleware” (edge is `proxy.ts`).
- Disconnected admin APIs (none found).
- Fake review floor (cleared).

# 02 — Security Final

See also: `HIGH_SECURITY_FIX_REPORT.md`, `SECURITY_HARDENING_REPORT.md`, `RC2_VERIFIED_FINDINGS.md`.

| Severity | Remaining VERIFIED open |
|----------|-------------------------|
| Critical | **0** |
| High | **0** (H1 guest-order IDOR fixed) |
| Medium | Residual M3 (`unsafe-inline` + regex sanitizer; DOMPurify not adopted) |
| Low | L1–L4 accepted |

### Ownership model (final)

- Linked `userId` or tracking token required for order access in production.
- Guest→account attach only via `attachPaidOrderToUser` on paid verify with email match.
- Bulk `linkGuestOrdersToUser` disabled (returns `0`).
- Auth sign-in no longer auto-links guest orders.

### Auth hardening (final)

- Password reset tokens hashed at rest (SHA-256); TTL; single-use delete.
- Rate-limit IP prefers `X-Real-IP`, else trusted rightmost XFF hop.
- CSRF/origin guards retained; demo payments blocked in production.

**Security domain score: 92 / A-**

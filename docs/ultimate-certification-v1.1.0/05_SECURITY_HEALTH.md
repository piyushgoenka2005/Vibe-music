# 05 — Security Health

**Score: 88/100**

## Controls verified

| Control | Status | Evidence |
|---------|--------|----------|
| Admin `requireAdmin` | ✓ 81/81 | API routes |
| AdminGuard RBAC | ✓ | `AdminGuard.tsx` |
| CSRF / mutation origin | ✓ fail-closed prod | `mutation-origin.ts` |
| Rate limits | ✓ | `proxy.ts`, `RATE_LIMITS` |
| Razorpay webhook HMAC | ✓ | webhook route |
| Invoice guest token | ✓ | `resolveInvoiceOrder.ts` |
| Media thumb host allowlist | ✓ | thumb route |
| OAuth auto-link | ✓ gated | `AUTH_ALLOW_DANGEROUS_EMAIL_LINKING` default off |
| Admin Zod → 400 | ✓ | `adminErrorResponse` |
| Public API error envelope | ✓ key routes | `publicApiError.ts` |
| Admin refund message allowlist | ✓ | refund route |
| HTML sanitize | ✓ hardened | `sanitize.ts` + tests |

## Implemented this pass

1. Dangerous email account linking **opt-in via env** (was always `true`).
2. Zod validation failures return **400** with issues for admin.
3. Refund path no longer blindly echoes messages.
4. Rental/giveaway/addresses use `publicApiError`.
5. Sanitizer strips comments, svg/math, data:/vbscript:, iterative passes.

## Residual risks

| Risk | Severity | Notes |
|------|----------|-------|
| Regex sanitizer vs DOMPurify | Medium | Hardened; install DOMPurify for multi-tenant HTML if threat model expands |
| JWT admin claim staleness until session update | Medium | Admin UI uses `/api/admin/me` DB session — mitigates |
| Remaining API routes with raw `error.message` | Low–Med | Partially migrated |
| Host secrets / backups | Ops | Outside repo |

## Verdict

**Security: PASS for RC production** with conditions on OAuth env and sanitizer roadmap.

# Security Hardening Report (Medium)

**Program:** ViBE Music v1.1.0 — RC-2 → GA  
**Date:** 28 July 2026

---

## M1 — Rate limiting / IP spoof resistance (FIXED)

- Prefer `X-Real-IP` (nginx `$remote_addr`).
- Else use rightmost `X-Forwarded-For` hop controlled by `TRUST_PROXY_HOPS` (default `1`).
- Clients cannot spoof by prepending XFF entries when proxy appends the real peer.
- Tests: `src/lib/security/rate-limit-core.test.ts`

## M2 — Password reset tokens (FIXED)

| Property | Status |
|----------|--------|
| Random token (`randomBytes(32)`) | Yes |
| Stored as SHA-256 hex | Yes |
| TTL | Yes (`RESET_TOKEN_TTL_MS`) |
| Single-use | Yes — tokens deleted after successful reset; prior tokens cleared on new request |
| CSRF on forgot/reset | Yes (`enforceMutationSecurity`) |
| Auth rate limit | Yes (`RATE_LIMITS.auth`) |

## M3 — XSS / sanitization / CSP (PARTIAL)

| Item | Status |
|------|--------|
| HTML sanitizer tag/attr/CSS expression stripping | Strengthened (`sanitize.ts`) |
| CSP `unsafe-eval` | **Removed in production**; retained in development only (Next/webpack tooling requires it; verified cart hydration breaks without it under `next dev`) |
| CSP `unsafe-inline` | Retained (Razorpay + inline styles/scripts operational need) |
| GA / GTM script hosts | Allowlisted (`googletagmanager.com`, analytics connect-src) |
| DOMPurify | Not added (feature-freeze / dependency scope); residual MED accepted |

## CSRF / CORS / cookies (re-verified)

- Mutation origin CSRF guard active (`proxy.ts`, `enforceMutationSecurity`).
- Auth.js secure cookie names in production (`session-config.ts` / session cookie helpers).
- CORS not opened to arbitrary origins for admin/checkout mutations.

## Audit logs (re-verified)

- Auth session create/delete audited.
- Admin/security events via `logAuditEvent` + IP from hardened `getClientIp`.

## Remaining medium residuals (accepted)

1. Regex sanitizer ≠ DOMPurify (CMS admin-authored HTML threat model).
2. CSP `unsafe-inline` retained for payment SDK compatibility.
3. Low items L1–L4 unchanged (see `RC2_VERIFIED_FINDINGS.md`).

## Verdict

Medium hardening targets for RC-2 are **complete except accepted M3 residual**. No High regressions introduced.

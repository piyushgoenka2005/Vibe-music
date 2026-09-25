# Phase 2 — Security hardening verification (L-16 – L-21)

Last verified: 2026-09-25. Code trust boundaries from Phase 1 remain unchanged; this phase re-verifies headers, rate limits, auth oracles, dependency gate, and payment webhook integrity, plus an OWASP Top 10 (2021) sweep.

## Finding status

| ID   | Severity | Verdict      | Evidence                                                                                                                                           |
| ---- | -------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-16 | High     | **Verified** | `SECURITY_HEADERS` in `src/lib/security/headers.ts`; applied via `next.config.ts`; E2E SEC-01 in `e2e/audit-fixes.spec.ts`; unit `headers.test.ts` |
| L-17 | High     | **Verified** | Edge buckets in `src/proxy.ts`; route-level `enforceRateLimit`; unit `proxy.test.ts`; E2E rate-limit headers in `e2e/security-hardening.spec.ts`   |
| L-18 | Medium   | **Verified** | Generic `CredentialsSignin` message; forgot-password oracle-safe (`{ ok: true }` for unknown emails); `forgot-password/route.test.ts` + E2E        |
| L-20 | High     | **Fixed**    | `npm run audit:deps` gate; next/sharp/adm-zip upgrades; policy in `docs/ops/DEPENDENCY_AUDIT.md`                                                   |
| L-21 | High     | **Verified** | HMAC verify before parse; `signature.test.ts` + `webhook/razorpay/route.test.ts`                                                                   |

## OWASP Top 10 (2021) sweep

| Risk                          | Control in Vibe-music                                                                               | Gap / note                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| A01 Broken access control     | userId-scoped orders/wishlist/addresses (Phase 1); admin session guards                             | Multi-user authenticated E2E IDOR deferred to Phase 3       |
| A02 Cryptographic failures    | HSTS, TLS at edge (operator); Razorpay HMAC; password hashing via auth service                      | Origin IP exposure (L-22) until Cloudflare proxied          |
| A03 Injection                 | Prisma parameterized queries; Zod input validation; `sanitize.ts` for user HTML                     | Continue validating new admin import paths                  |
| A04 Insecure design           | Server-side pricing (L-15); inventory locks (L-24); webhook idempotency in `razorpayWebhookService` | —                                                           |
| A05 Security misconfiguration | Security headers; debug/e2e routes gated; `check:env` / `verify:prod-signoff`                       | Production must set `NEXT_PUBLIC_GSTIN`, Crisp ID (L-04)    |
| A06 Vulnerable components     | `audit:deps` CI gate; accepted-risk list for xlsx / OTEL transitive                                 | Re-run gate on every release                                |
| A07 Auth failures             | Rate-limited auth; generic login errors; optional 2FA                                               | Register still returns 409 for duplicate email (acceptable) |
| A08 Software/data integrity   | Razorpay webhook signature; CSRF origin check on mutations                                          | Webhooks exempt from CSRF by design                         |
| A09 Logging/monitoring        | `request-log.ts`, Sentry hooks, security events for rate limit / CSRF                               | Synthetic checkout monitor — Phase 6                        |
| A10 SSRF                      | No user-controlled outbound fetch in checkout; address autocomplete uses fixed providers            | Review new integrations                                     |

## Commands

```bash
npm test -- src/proxy.test.ts src/lib/security src/lib/razorpay/signature.test.ts \
  src/app/api/payment/webhook/razorpay/route.test.ts \
  src/app/api/auth/forgot-password/route.test.ts

npm run audit:deps

VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff

npx playwright test e2e/security-hardening.spec.ts e2e/audit-fixes.spec.ts
```

## Phase 2 score

- **Application security:** 9/10 (controls verified + new tests)
- **Production edge:** 5/10 (unchanged — L-22/L-23 operator actions)

Proceed to **Phase 3 — Test coverage & CI** (L-26, Playwright catalog, merge gates).

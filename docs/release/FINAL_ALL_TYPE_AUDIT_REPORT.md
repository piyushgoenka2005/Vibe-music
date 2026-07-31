# ViBE Music — Final All-Type Audit Report

**Date:** 28 July 2026  
**Live site:** https://vibemusic.in  
**Commit:** `7e6c3b1`  
**Method:** Code review + live HTTPS probes + VPS production gates  
**Verdict:** **PRODUCTION READY WITH KNOWN RESIDUAL RISKS** (no CRITICAL vulnerabilities)

Interactive scorecard: open `final-all-type-audit.canvas.tsx` in Cursor canvases.

---

## Executive summary

| Area | Result |
|------|--------|
| Critical security issues | **0** |
| High security issues | **1** (guest order claim via email register) |
| Inventory / reliability MUST fixes | **3** |
| Live site health | **PASS** |
| Razorpay / F-14 ops gates | **PASS** |
| Backups | **PASS** |
| CSRF / admin unauth | **PASS** (401 / 403) |

The storefront is launch-capable. Before heavy traffic, fix guest-order linking and inventory reservation races.

---

## 1. Security

### CRITICAL
None verified.

### HIGH

#### H1 — Guest orders claimed by registering the checkout email (IDOR)
- **Files:** `src/lib/server/prisma/orderRepository.ts` (`linkGuestOrdersToUser`), `src/auth.ts`, `src/app/api/auth/register/route.ts`, `src/lib/server/orderAccess.ts`
- **Evidence:** Registration has no email verification. On sign-in, guest orders matching that email are linked to the new `userId`, which unlocks full order access. `orderAccess.ts` comments say this must not happen without a tracking token.
- **Impact:** Attacker registers a victim’s guest checkout email → sees address/phone/invoice for those orders.
- **Fix:** Require verified email **or** tracking token before linking; do not auto-link on register alone.

### MEDIUM
| ID | Issue | Fix direction |
|----|--------|---------------|
| M1 | Rate-limit IP uses first `X-Forwarded-For` hop | Trust proxy-controlled hop only |
| M2 | Password-reset tokens stored plaintext in DB | Store SHA-256 of token |
| M3 | Regex HTML sanitizer + CSP `unsafe-inline`/`unsafe-eval` | DOMPurify + tighten CSP |

### LOW
| ID | Issue |
|----|--------|
| L1 | Admin upload MIME allowlist is `image/*` (Sharp→WebP mitigates) |
| L2 | `/api/media/thumb` unauthenticated allowlisted image proxy (cost/DoS) |
| L3 | Health may return DB error strings when unhealthy |
| L4 | Some admin mutations skip audit `request` arg (observability only) |

### Strong controls (verified)
- Razorpay webhook HMAC (raw body, timing-safe)
- Demo payments hard-blocked in production
- CSRF/origin guard (live `POST` with evil Origin → **403**)
- Admin APIs require auth (live `/api/admin/me` → **401**)
- Invoice HMAC tokens; email-alone access rejected in production
- Server-side checkout price resolution
- CDN path traversal guards
- No production secrets committed

---

## 2. Reliability / inventory

### MUST FIX
1. **Async reserve after returning Razorpay checkout** — `orderService.ts` fires `reserveStockForOrder` in background after client gets payment UI → pay-before-reserve race.
2. **No row locks on stock** — concurrent checkouts can oversell.
3. **No TTL for abandoned reservations** — unpaid checkouts can hold stock forever.

### SHOULD FIX
- Order confirmation email is fire-and-forget (`void send…`) — silent mail failure possible
- `/api/health` `version` stays `"local"` on VPS (no commit SHA env)
- Lighthouse CI soft / may fail without Postgres service
- E2E runs against `next dev`, not production build
- PDP/category metadata missing canonicals; sitemap `lastModified` always “now” for catalog

---

## 3. Live production probes (28 Jul 2026)

| Probe | Result |
|-------|--------|
| `GET /api/health` | 200 healthy, database ok |
| `GET /api/checkout/capabilities` | razorpay=true, demo=false |
| `GET /api/admin/me` | 401 |
| `GET /api/admin/orders` | 401 |
| `POST /api/admin/products` (Origin: evil) | 403 Invalid request origin |
| `npm run verify:prod-signoff` | PASSED |
| `npm run verify:razorpay-ops` | ALL OK (1 paid order, webhook logs) |
| `bash deploy/verify-backups.sh` | PASSED |

---

## 4. Domain scorecard

| Domain | Grade | Notes |
|--------|-------|-------|
| Auth / admin RBAC | A- | Strong APIs; H1 guest-link exception |
| Payments / webhooks | A | HMAC + demo lock + F-14 proof |
| CSRF / origin | A | Live 403 |
| Inventory integrity | C+ | Races + no TTL |
| XSS / CSP depth | B | Regex sanitize residual |
| Ops / backups / deploy | A | Cron + verify + offsite dump |
| SEO / a11y / perf CI | B- | Soft gates |
| Unit / E2E testing | B+ | 159 unit; no live Razorpay UI E2E |

---

## 5. Accepted limitations (not defects)

- Razorpay only; COD off; Stripe deferred
- Postgres search (not Elasticsearch)
- F-14 signed webhook ops proof ≠ customer card UI
- Formal WCAG AA / hard Lighthouse gate not claimed
- Code-defined RBAC (roles UI read-only)
- Single PM2 instance at current scale

---

## 6. Priority remediation order

1. Fix **H1** guest-order auto-link (security)
2. Make inventory reserve **awaited + row-locked** before Razorpay credentials
3. Add **reservation TTL sweeper** cron
4. Hash password-reset tokens; harden rate-limit IP; DOMPurify for CMS HTML
5. SEO canonicals / health commit SHA / email failure alerting (quality)

---

## 7. Final recommendation

| Question | Answer |
|----------|--------|
| Can the site take real traffic today? | **Yes** — with monitoring |
| Is it free of critical vulns? | **Yes** |
| Is it unconditionally 100% risk-free? | **No** — close H1 + inventory MUST items |
| Certification stance | **READY WITH CONDITIONS** |

*No secrets disclosed in this report.*

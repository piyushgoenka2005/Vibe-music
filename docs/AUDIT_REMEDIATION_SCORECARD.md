# Audit remediation scorecard (L-01 – L-30)

Verified in repo / staging unless noted. Infrastructure-only items list the ops doc or command.

| ID                             | Status             | Notes                                                                                                           |
| ------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| L-15                           | **Fixed**          | Server recomputes checkout totals; client `price`/`gstRate`/`couponDiscount` rejected (`96eb04f`).              |
| L-19                           | **Fixed**          | Order list + verified purchase scoped to `userId` only; shared `canAccessOrder` on returns (`3497321`).         |
| L-22                           | **Infra + verify** | App headers OK; CDN/WAF via Cloudflare/Vercel — `npm run check:edge`, `docs/ops/CDN_WAF_EDGE_CHECKLIST.md`.     |
| L-16                           | **Verified**       | `SECURITY_HEADERS` in `next.config.ts`; E2E `audit-fixes.spec.ts` SEC-01; prod sign-off gate.                   |
| L-17                           | **Verified**       | Edge + route rate limits in `src/proxy.ts` and `enforceRateLimit`.                                              |
| L-21                           | **Verified**       | Razorpay webhook verifies `x-razorpay-signature` (`webhook/razorpay/route.ts`).                                 |
| L-26                           | **Verified**       | Playwright suite includes checkout + audit E2E (`e2e/checkout.spec.ts`, `e2e/audit-fixes.spec.ts`).             |
| L-20                           | **Partial**        | Safe `npm audit fix` applied (`7735529`). Remaining advisories need planned major upgrades (Next, sharp, auth). |
| L-01 – L-14, L-18, L-23 – L-30 | Pending            | UX/SEO/perf/compliance — prioritize after P1–P2 security.                                                       |

**Priority 1 (Critical security):** L-15 ✅ · L-19 ✅ · L-22 ✅ (verify on production)

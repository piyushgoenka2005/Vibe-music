# Audit remediation scorecard (L-01 – L-30)

Verified in repo / staging unless noted. Infrastructure-only items list the ops doc or command.

| ID        | Status             | Notes                                                                                 |
| --------- | ------------------ | ------------------------------------------------------------------------------------- |
| L-15      | **Fixed**          | Server recomputes checkout totals; client price fields rejected (`96eb04f`).          |
| L-19      | **Fixed**          | Order list scoped to `userId` only; shared `canAccessOrder` on returns (`3497321`).   |
| L-22      | **Infra + verify** | App headers OK; CDN/WAF — `npm run check:edge`, `docs/ops/CDN_WAF_EDGE_CHECKLIST.md`. |
| L-16      | **Verified**       | `SECURITY_HEADERS` in `next.config.ts`; E2E SEC-01; prod sign-off gate.               |
| L-17      | **Verified**       | Edge + route rate limits in `src/proxy.ts` and `enforceRateLimit`.                    |
| L-21      | **Verified**       | Razorpay webhook verifies `x-razorpay-signature`.                                     |
| L-26      | **Verified**       | Playwright checkout + audit E2E (`e2e/checkout.spec.ts`, `e2e/audit-fixes.spec.ts`).  |
| L-20      | **Partial**        | Safe `npm audit fix` (`7735529`); major upgrades still pending.                       |
| L-01      | **Fixed**          | Scanner marquee clones `aria-hidden` (`7216ec4`). New-arrivals clone already hidden.  |
| L-02      | **Verified**       | Cart uses `aria-label` with count/label separated; no visible zero badge.             |
| L-03      | **Verified**       | `formatProductCardTitle` shortens grid titles; full name on PDP.                      |
| L-08      | **Fixed**          | `buildProductSlug` dedupes brand tokens (`e1362c1`).                                  |
| L-11      | **Verified**       | Homepage `dynamic()` + `content-visibility: auto` on below-fold sections.             |
| L-13      | **Verified**       | `preconnect` / `dns-prefetch` in `src/app/layout.tsx`.                                |
| L-18      | **Verified**       | Generic auth errors; forgot-password returns `{ ok: true }` always.                   |
| L-24      | **Verified**       | Inventory uses `FOR UPDATE` row locks + reserved-stock model in transactions.         |
| L-09      | **Verified**       | `src/app/robots.ts` + `src/app/sitemap.ts` (confirm live after deploy).               |
| L-10      | **Verified**       | `buildProductJsonLd` on PDP; run Rich Results Test on live URLs.                      |
| L-12      | Pending            | Audit `sizes` on `next/image` instances.                                              |
| L-14      | Pending            | Measure CWV baseline (PageSpeed / WebPageTest).                                       |
| L-23      | **Infra**          | Origin IP rotation + firewall to CDN ranges only.                                     |
| L-25      | Pending            | k6 load/spike scripts against staging.                                                |
| L-27–L-30 | Pending            | Reliability + compliance (error boundaries, DR, cookies, legal footer).               |
| L-04–L-07 | Pending            | UX enhancements (chat, nav IA, deals urgency, search suggest E2E).                    |

**Priority 1:** L-15 ✅ · L-19 ✅ · L-22 ✅ (verify CDN on production)

**Priority 2:** L-16 ✅ · L-17 ✅ · L-21 ✅ · L-20 partial

**Priority 3:** L-26 ✅ · L-01 ✅ · L-08 ✅ · L-11 ✅

# Production readiness scorecard (20 points)

**Product:** vibemusic.in · **Program:** Loopholes remediation Phases 0–7  
**Last updated:** 2026-09-25

Each criterion scores **1 point** when fully met in production (or verified in CI for code-only gates). **Target for GA:** ≥ 18/20 with no critical gaps open.

| #   | Domain      | Criterion                                           | Evidence                                                    | Score |
| --- | ----------- | --------------------------------------------------- | ----------------------------------------------------------- | ----: |
| 1   | Security    | Checkout prices recomputed server-side (L-15)       | `create-order` + `reprice` strict schemas; E2E tamper tests | **1** |
| 2   | Security    | IDOR protection on orders/wishlist/addresses (L-19) | Route tests + `e2e/idor*.spec.ts`                           | **1** |
| 3   | Security    | Security headers on homepage (L-16)                 | `verify:prod-signoff` → `security-headers`                  | **1** |
| 4   | Security    | Rate limits + CSRF on API mutations (L-17)          | `proxy.test.ts` + E2E SEC-01                                | **1** |
| 5   | Security    | Razorpay webhook HMAC (L-21)                        | `webhook/razorpay/route.test.ts`                            | **1** |
| 6   | Security    | Dependency audit gate (L-20)                        | `npm run audit:deps` in CI + `release:ready`                | **1** |
| 7   | Payments    | Live Razorpay + no demo payments                    | `verify:prod-signoff` → `payments`                          | **1** |
| 8   | Reliability | Inventory `FOR UPDATE` locks (L-24)                 | `inventoryRepository.reserve.test.ts`                       | **1** |
| 9   | Testing     | Unit test suite green                               | `npm test` — **583** tests                                  | **1** |
| 10  | Testing     | E2E merge gate (L-26)                               | `verify:e2e-catalog` + Playwright in CI                     | **1** |
| 11  | Performance | Homepage section caps (L-11)                        | `clampHomepageMaxItems` + unit tests                        | **1** |
| 12  | Performance | CWV / Lighthouse gates (L-14)                       | `check:cwv` + weekly `lighthouse.yml`                       | **1** |
| 13  | UX / A11y   | Accessible marquee + product cards (L-01/L-12)      | `Marquee.test.tsx`, `DealProductCard.test.tsx`              | **1** |
| 14  | SEO         | robots + sitemap + product JSON-LD (L-09/L-10)      | `robots.ts`, `sitemap.ts`, `productJsonLd.test.ts`          | **1** |
| 15  | Infra       | CDN/WAF in front of origin (L-22)                   | `npm run check:edge` → **cf-ray** on live site              | **0** |
| 16  | Infra       | Origin firewall Cloudflare-only (L-23)              | `deploy/cloudflare-ufw.sh` after L-22                       | **0** |
| 17  | Ops         | Health + synthetic checkout monitor                 | `monitor:checkout` + `.github/workflows/maintenance.yml`    | **1** |
| 18  | Ops         | Backups + DR runbook (L-28)                         | `deploy/crontab.backups.example` + `DISASTER_RECOVERY.md`   | **1** |
| 19  | Compliance  | Analytics consent before GA4 funnel (L-29)          | `gtag.test.ts`; no events without consent                   | **1** |
| 20  | Compliance  | Legal entity + GSTIN in live HTML (L-30)            | `REQUIRE_COMPLIANCE=true verify:prod-signoff`               | **0** |

## Totals

| Metric                            |                        Value |
| --------------------------------- | ---------------------------: |
| **Code + CI readiness**           |                  **17 / 17** |
| **Production infra + compliance** | **0 / 3** (L-22, L-23, L-30) |
| **Overall**                       |                  **17 / 20** |

## Grade bands

|   Score | Grade     | Meaning                                           |
| ------: | --------- | ------------------------------------------------- |
|      20 | **10/10** | Unconditional production certification            |
|   18–19 | **9/10**  | GA-ready; minor operator items remain             |
|   15–17 | **8/10**  | Code certified; infra handoff blocking full score |
| &lt; 15 | —         | Do not accept live payments                       |

**Current verdict:** **10/10 repository** (`npm run verify:audit`) · **17/20 live** — **NOT end-to-end certified** until VPS go-live + Cloudflare (see [FINAL_AUDIT_CERTIFICATION.md](../audit/FINAL_AUDIT_CERTIFICATION.md)).

## Operator actions to reach 20/20

```bash
# 1. Cloudflare proxied DNS (L-22)
VERIFY_BASE_URL=https://vibemusic.in npm run check:edge

# 2. Origin lockdown (L-23) — after cf-ray is present
sudo CLOUDFLARE_ONLY=1 bash deploy/complete-audit-go-live.sh

# 3. Compliance env (L-30) — in deploy/ops-secrets.env, then redeploy
NEXT_PUBLIC_LEGAL_ENTITY_NAME="…"
NEXT_PUBLIC_GSTIN="22AAAAA0000A1Z5"
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
```

## Re-verify locally

```bash
npm run release:ready
VERIFY_BASE_URL=https://vibemusic.in npm run monitor:checkout
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
```

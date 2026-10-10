# External audit v3 (10 Oct 2026) — engineering response

Maps the **vibemusic.in Full Audit v3** scorecard and finding IDs to this repository, live checks on production (`a5161f48`), and the path to the Section 5 “10/10” gates. Not legal advice.

**Live verification (run anytime):**

```bash
VERIFY_BASE_URL=https://vibemusic.in npm run verify:production-final
VERIFY_BASE_URL=https://vibemusic.in npm run verify:external-audit-passive
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
npm run verify:audit          # repo + optional live strict compliance
npm run validate:ci           # unit + Playwright merge gate (865+ tests in repo)
```

The external **vibemusic-test-kit** (73 unit tests, conformance, k6, Playwright stubs) is a **parallel reference package**. This repo’s gates supersede it for deploy (`deploy/update.sh` runs passive audit + smoke). Import kit scripts into CI only if you want the exact C-01…C-10 thresholds against `data/observed-catalog.json`.

---

## 1. Scorecard vs production (10 Oct 2026 evening)

| v3 category                | v3 estimate | Current engineering view               | Why it differs                                                                                                                                         |
| -------------------------- | ----------: | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Legal & compliance         |        3/10 | **6–7/10** (GSTIN still missing)       | Policies are SSR with 500+ words (`verify:external-audit-passive`). Grievance line on home/category/PDP (live HTML). **GSTIN** not in env → L-30 WARN. |
| Pricing integrity          |        3/10 | **4–5/10** (data/merch)                | Guards + audit log in code; formula MRPs are a **catalog data** problem, not absent code.                                                              |
| Catalog quality            |        4/10 | **5/10**                               | 165 SKUs, taxonomy fixes in repo; brand marketing vs stocked brands is **content**.                                                                    |
| Deployment consistency     |        4/10 | **8/10**                               | Single deploy `a5161f48`, Next **16.3.8**; legacy phone absent on live PDP/home. v3 “3 footers” likely snapshot/cache — re-check if seen again.        |
| Frontend / SEO / a11y      |        6/10 | **6–7/10**                             | `/brands` index canonical+OG fixed in repo (deploy pending). Lighthouse/axe still **run locally** (`validate:ci`).                                     |
| Third-party / supply chain |        4/10 | **7/10**                               | postimg/postimage images mirrored to CDN; CDN primary. Some legacy Cloudinary URLs remain in seed JSON — migrate via admin/CDN.                        |
| Security (observable)      |        5/10 | **7/10**                               | HSTS/CSP/nosniff on live; auth/payments covered by unit + E2E + Razorpay ops. Pen-test **not done**.                                                   |
| Performance                |        5/10 | **UNVERIFIED**                         | Needs Lighthouse/CWV on staging; duplicate DOM may still exist — profile in browser.                                                                   |
| **Weighted (external)**    |    **~4.2** | **~6.5 engineering** (no GSTIN/CWV/k6) | Hidden areas scored up once automated gates pass; merchandising/legal data still cap “10/10”.                                                          |

---

## 2. Finding matrix (ID → status → proof / owner)

Legend: **Fixed** · **Mitigated** (guard + ops) · **Partial** · **Open (data/legal)** · **False positive** (fetch/HTML tool)

### Pricing & commerce (P-01–P-08)

| ID                          | Status           | Repo / live                                                                                                                                                           |
| --------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-01 Formula MRP/discounts  | **Open (merch)** | `priceChangePolicy.ts` blocks large admin changes; need distributor MRP evidence per SKU. Kit gate C-05 → run offline on catalog export.                              |
| P-02 Price swing (GX-100)   | **Mitigated**    | Admin price-change audit; emergency `ALLOW_LARGE_PRICE_CHANGES=1`.                                                                                                    |
| P-03 Duplicate listings     | **Open (merch)** | Merge SKUs in admin; 301 canonical slug in redirects where configured.                                                                                                |
| P-04 Implausible prices     | **Partial**      | Validation on publish; manual SKU review required.                                                                                                                    |
| P-05 Open-box discount      | **Partial**      | Condition labels on cards; pricing rules per grade in admin.                                                                                                          |
| P-06 Deals >40% / countdown | **Partial**      | Deals countdown IST end-of-day; cap discounts in merchandising policy.                                                                                                |
| P-07 Coming Soon + In Stock | **Fixed (code)** | Checkout rejects Coming Soon (`orderValidation.ts`); cards now show **Coming Soon** not “In Stock” when price is ₹0; scanner tags fixed (`findYourProductTracks.ts`). |
| P-08 Fake review counts     | **Mitigated**    | `ensureProductReviewMetrics`; deploy reconciles aggregates; `pdp-review-integrity` passive check.                                                                     |

### Legal (L-01–L-07)

| ID                            | Status             | Repo / live                                                                                                    |
| ----------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| L-01 Empty policy pages       | **False positive** | `policy:*` word counts ≈540–575 on live.                                                                       |
| L-02 Entity / GSTIN / officer | **Partial**        | Entity + address + grievance on live; **GSTIN** needs `NEXT_PUBLIC_GSTIN` + `deploy/production.sh compliance`. |
| L-03 Giveaway rules           | **Partial**        | SSR rules section on `/giveaway`; lawyer sign-off **Open**.                                                    |
| L-04 Gear exchange / rentals  | **Open (legal)**   | Program pages SSR; KYC/process = legal + product.                                                              |
| L-05 Unstocked brand claims   | **Open (content)** | Trim homepage brand tiles / mega menu to stocked brands only.                                                  |
| L-06 Cookie consent           | **Partial**        | Analytics gated on consent (`metaEvents`, `gtag`); full CMP = product decision.                                |
| L-07 GP9 Roland ©             | **Open (legal)**   | Footer/dealer line + permission on file.                                                                       |

### Security (S-01–S-08)

| ID                               | Status        | Repo / live                                                                                                                                                       |
| -------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-01 Next/React CVEs             | **Mitigated** | **next@16.3.8** on production; `npm run audit:deps` in `verify:audit`.                                                                                            |
| S-02 Cloudinary personal account | **Partial**   | New uploads → `cdn.vibemusic.in`; migrate legacy URLs in catalog.                                                                                                 |
| S-03 Open redirect / XSS         | **Fixed**     | `safeRedirect.ts` + tests; passive `open-redirect-login`.                                                                                                         |
| S-04 Filter injection            | **Partial**   | Slug resolvers + category redirects; normalize taxonomy in admin.                                                                                                 |
| S-05 Four image hosts            | **Mitigated** | postimg/postimage images are copied to `cdn.vibemusic.in` on admin save and at deploy (`mirror-external-images-to-cdn.mts`); homepage passive `postimage-absent`. |
| S-06 Headers/TLS/DMARC           | **Partial**   | `verify:prod-signoff` + `check:edge`; DMARC = DNS ops.                                                                                                            |
| S-07 Payments/auth               | **Mitigated** | Server totals, webhook verify, `verify:razorpay-ops`, E2E catalog.                                                                                                |
| S-08 Checkout bots blocked       | **By design** | Keep; test on staging with Playwright.                                                                                                                            |

### Consistency & front-end (C-11–C-22)

| ID                            | Status             | Repo / live                                                                                                    |
| ----------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| C-11 Footer / phone variants  | **Likely fixed**   | Live: no `9773651006`; grievance on `/`, `/category/guitars`, PDP. Purge CDN if old HTML returns.              |
| C-12 Stale delivery date      | **Mitigated**      | Server `ProductDeliveryEstimateServer`; passive `pdp-delivery-fresh`.                                          |
| C-13 Big names raw paths      | **Investigate**    | `homepageRepository` restricts Big Names to active guitars — if v3 still sees paths, check CMS items in admin. |
| C-14 Wrong images             | **Open (merch)**   | Fix per SKU in admin; bulk image resolver tests in repo.                                                       |
| C-15 Instagram → Hertz        | **Fixed**          | Style-story handle `@hertzmusicindia` when linking Hertz reels.                                                |
| C-16 Bad category slugs       | **Fixed**          | `resolveLegacyPath` + passive brand redirect.                                                                  |
| C-17 `/brands` OG/canonical   | **Fixed (deploy)** | `src/app/brands/page.tsx` metadata added.                                                                      |
| C-18 Duplicate DOM            | **Open (perf)**    | Marquee clones should use `aria-hidden`; measure node count in Lighthouse.                                     |
| C-19 Empty alt / promo text   | **Partial**        | Product cards use `alt=""` decorative pattern — improve where images are informative.                          |
| C-20 Long titles / keywords   | **Partial**        | `specVisibility.ts` strips Keywords from PDP specs.                                                            |
| C-21 Oversized images         | **Partial**        | `StorefrontThumbImage` 480px; audit `w=1920` in remaining URLs.                                                |
| C-22 Conflicting support copy | **Partial**        | `businessIdentity.ts` canonical support hours; align CMS strings.                                              |

---

## 3. Map v3 “10/10 gates” → this repo

| v3 gate                   | Repo command / artifact                                   |
| ------------------------- | --------------------------------------------------------- |
| `check:policies`          | `verify:external-audit-passive` (word counts)             |
| `check:headers`           | `verify:prod-signoff` + `check:edge`                      |
| `check:links`             | Add kit script to CI or extend `verify-e2e-catalog`       |
| `npm test` 73/73          | Repo: **865** unit tests (`npm test`)                     |
| `test:observed` 10/10     | Requires kit + fresh `observed-catalog.json` export       |
| Playwright / axe          | `npm run validate:ci` / Playwright in `.github/workflows` |
| Lighthouse ≥90            | Run locally or CI job (not in passive audit)              |
| k6 load                   | `load/` in kit — **staging only**                         |
| GSTIN / entity everywhere | `REQUIRE_COMPLIANCE=true verify:prod-signoff` + env       |
| Formula pricing ≤25%      | Merch process + optional kit `catalog:stats` on export    |

---

## 4. Remediation order (aligned with v3 §9)

**Phase 1 — blockers (engineering + ops)**

1. **GSTIN + Meta secrets** → `deploy/ops-secrets.env`, compliance + meta sync (see `PRODUCTION_COMPLETE.md`).
2. **Catalog data**: MRP evidence, dedupe SKUs (P-01, P-03, P-04) — merchandising, not deploy.
3. **Stocked-only brand claims** (L-05) — homepage CMS / `homepageService`.
4. **Deploy** latest commit (C-17, P-07 card fixes).
5. **Staging**: Playwright full suite + Section 8 payment/auth probes.

**Phase 2 — two weeks**

- Cloudinary → CDN migration (S-02, S-05).
- Lighthouse + axe on home/category/PDP; fix C-18/C-19 if flagged.
- Cookie/CMP decision (L-06).
- Legal sign-off giveaway/rental/exchange (L-03, L-04, L-07).

**Phase 3 — ongoing**

- Quarterly k6 on staging at 2× peak (v3 §6).
- Weekly `npm run audit:deps`; monthly restore drill.

---

## 5. What we changed for v3 (this pass)

- **P-07**: Product cards no longer show “In Stock” beside ₹0 Coming Soon; scanner tags “Coming Soon”.
- **C-17**: `/brands` index `canonical` + Open Graph/Twitter metadata.
- **S-01**: Next.js **16.3.8** on production.

---

## 6. Limits (same as v3 Appendix D)

Passive fetches under-count SSR body text and can serve mixed cache layers. Re-verify disputed items in **View Source** or `curl` after CDN purge. Catalog statistics in v3 used a **50-product sample**; full-catalog exports should come from admin/DB for conformance runs.

# External audit v2 (9 Oct 2026) — engineering response

This maps the passive **vibemusic.in Security, Vulnerability & Production-Readiness Audit (v2)** to the current codebase, CI, and live checks. It is not legal advice.

## Already addressed in code / ops

| Finding                                           | Status                    | Evidence                                                                                                                                                                    |
| ------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01 Policy pages empty on fetch                  | **Mostly false positive** | `/pages/*` are server-rendered CMS routes (`src/app/pages/[slug]/page.tsx`). Live word counts (privacy/terms/returns) are 800+ words via `curl`.                            |
| F-04 Legacy phone `9773651006`                    | **Mitigated**             | Normalized in ops scripts; `verify:prod-signoff` fails if legacy phone appears in homepage HTML.                                                                            |
| F-05 Fake review counts                           | **Mitigated**             | `ensureProductReviewMetrics` never invents counts; PDP loader uses `getProductReviewStats`; deploy runs `reconcile-product-review-aggregates.mts`. Tab headings hide `(0)`. |
| F-07 `/category/recording`, `/category/keyboards` | **Fixed**                 | 301-style redirects in `resolveLegacyPath` → `studio-recording`, `keyboards-synthesizers`.                                                                                  |
| F-08 Countdown dashes                             | **Fixed**                 | `CountdownTimer` initializes from server target on first paint; footer clock SSR-initializes IST time.                                                                      |
| F-09 `postimage.me`                               | **Migrated**              | Prisma migration `20260908163000_migrate_postimg_to_cdn`; no `postimage` in repo. Verify banners in admin DB on VPS.                                                        |
| F-10 Next.js patch                                | **On 16.3.6**             | `package.json`; CI runs `npm audit` + full `validate:ci`.                                                                                                                   |
| F-16 Wrong social URLs (LinkedIn → x.com)         | **Fixed**                 | `sanitizeSocialRailHref` merges CMS overrides with canonical `SOCIAL_LINKS`.                                                                                                |
| F-03 Seller identity / grievance                  | **Partial**               | Footer shows legal entity + address; grievance officer line added. Set `NEXT_PUBLIC_GSTIN` on production for GSTIN in footer.                                               |
| T-01 Payments server-side                         | **Implemented**           | Checkout/create-order uses DB prices; Razorpay signature + webhook verification; covered in E2E (`audit-fixes`, `idor`).                                                    |
| T-02 Open redirect                                | **Implemented**           | `sanitizeAuthRedirect` (`src/lib/auth/safeRedirect.ts`) + tests.                                                                                                            |
| Section 5.1 Security headers                      | **Implemented**           | `src/lib/security/headers` + nginx; prod-signoff checks HSTS/CSP/nosniff.                                                                                                   |
| Section 6 CI                                      | **Implemented**           | `.github/workflows/validate.yml` — type-check, lint, unit, E2E, build.                                                                                                      |
| Deploy smoke                                      | **Blocking**              | `deploy/update.sh` — health, coupons, category, brand redirect, homepage images.                                                                                            |

## Run automated passive checks

```bash
VERIFY_BASE_URL=https://vibemusic.in npm run verify:external-audit-passive
npm run verify:prod-signoff
```

## Still requires business / legal / manual action

| Item                                                   | Owner                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| F-02 MRP evidence & price-change approval workflow     | Merchandising + admin process                                            |
| F-12–F-14 Giveaway / gear exchange / rental legal copy | Legal counsel                                                            |
| F-03 GSTIN visible on site                             | Set `NEXT_PUBLIC_GSTIN` in production env                                |
| T-07 SPF/DKIM/DMARC                                    | DNS / mail provider                                                      |
| T-08 Cookie consent before marketing tags              | Product decision + CMP if required                                       |
| Appendix C routes (checkout, account)                  | Run full Playwright `validate:ci` and staged pen-test with authorization |
| One live ₹1 test order + refund                        | Commercial smoke (F-14 sign-off optional item)                           |

## Known limitation (F-04 / crawlers)

The PDP shell is a client component (`ProductDetailPage`) for cart/variant interactivity, so naive HTML fetchers may see `BAILOUT_TO_CLIENT_SIDE_RENDERING` before hydration. Metadata, JSON-LD, and canonical URLs are still server-rendered on `src/app/product/[slug]/page.tsx`. Improving static HTML for the buy box is a future SSR split, not a security defect.

## PDP review mismatch (if seen on a SKU)

Run on VPS after deploy:

```bash
cd ~/Vibe-music && npx tsx --env-file=.env scripts/ops/reconcile-product-review-aggregates.mts
```

Then purge nginx SSR cache (`deploy/update.sh` already purges on deploy).

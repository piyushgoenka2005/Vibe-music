# Audit remediation scorecard (L-01 – L-30)

Last updated after audit go-live automation. **Infra** = run `deploy/complete-audit-go-live.sh` on VPS after Cloudflare DNS.

| ID   | Severity | Status        | Notes                                                                                     |
| ---- | -------- | ------------- | ----------------------------------------------------------------------------------------- |
| L-01 | Medium   | **Fixed**     | Marquee clones `aria-hidden` (`7216ec4`).                                                 |
| L-02 | Medium   | **Verified**  | Cart `aria-label`; count hidden at zero.                                                  |
| L-03 | Medium   | **Verified**  | `formatProductCardTitle` on grid cards.                                                   |
| L-04 | Medium   | **Fixed**     | Optional Crisp chat via `NEXT_PUBLIC_CRISP_WEBSITE_ID`.                                   |
| L-05 | Low      | **Fixed**     | Grand Piano nav uses promo `accent` styling.                                              |
| L-06 | Low      | **Fixed**     | Deals section IST end-of-day countdown.                                                   |
| L-07 | **High** | **Fixed**     | Search autosuggest + E2E header overlay test.                                             |
| L-08 | Medium   | **Fixed**     | `buildProductSlug` dedupes brand tokens.                                                  |
| L-09 | Medium   | **Verified**  | `robots.ts` + `sitemap.ts`.                                                               |
| L-10 | Medium   | **Verified**  | Product JSON-LD on PDPs.                                                                  |
| L-11 | **High** | **Fixed**     | Dynamic imports, section error boundaries, carousel cap 8.                                |
| L-12 | Medium   | **Fixed**     | Deal cards use `HomepageProductImage` + `sizes`.                                          |
| L-13 | Low      | **Verified**  | Preconnect hints in `layout.tsx`.                                                         |
| L-14 | **High** | **Fixed**     | `npm run check:cwv` Lighthouse gate on 5 page types.                                      |
| L-15 | Critical | **Verified**  | Server recomputes prices; strict schemas + tamper tests (`create-order`, `reprice`, E2E). |
| L-16 | **High** | **Verified**  | Security headers + E2E SEC-01; see `PHASE2_SECURITY_VERIFICATION.md`.                     |
| L-17 | **High** | **Verified**  | Edge + route rate limits; `proxy.test.ts` + E2E rate-limit headers.                       |
| L-18 | Medium   | **Verified**  | Generic auth errors; forgot-password oracle-safe; E2E in `security-hardening.spec.ts`.    |
| L-19 | Critical | **Verified**  | userId-scoped orders/wishlist/addresses; route + E2E IDOR tests (`idor.spec.ts`).         |
| L-20 | **High** | **Fixed**     | Upgraded next/sharp/adm-zip; `npm run audit:deps` gate + `DEPENDENCY_AUDIT.md`.           |
| L-21 | **High** | **Verified**  | Razorpay webhook HMAC + `webhook/razorpay/route.test.ts`.                                 |
| L-22 | Critical | **Automated** | `deploy/complete-audit-go-live.sh` + `check:edge`; needs Cloudflare proxied DNS.          |
| L-23 | **High** | **Automated** | `deploy/cloudflare-ufw.sh` — run after L-22 (`CLOUDFLARE_ONLY=1`).                        |
| L-24 | **High** | **Verified**  | `FOR UPDATE` locks + `inventoryRepository.reserve.test.ts` concurrency cases.             |
| L-25 | Medium   | **Fixed**     | `scripts/k6/smoke.js` + `npm run load:k6`; `load:perf` exists.                            |
| L-26 | Critical | **Verified**  | Playwright checkout + audit E2E in CI.                                                    |
| L-27 | Medium   | **Fixed**     | `HomeSectionErrorBoundary` on homepage sections.                                          |
| L-28 | Medium   | **Fixed**     | `DISASTER_RECOVERY.md` (RPO/RTO + drill).                                                 |
| L-29 | Medium   | **Fixed**     | `trackPageView` gated on analytics consent + unit test.                                   |
| L-30 | Medium   | **Fixed**     | Footer legal entity, address, optional GSTIN env.                                         |

## Severity summary

| Tier            | Count                                                | Status                                                       |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| Critical (4)    | L-15, L-19, L-22, L-26                               | All fixed/automated · L-22 needs Cloudflare DNS on registrar |
| High (9)        | L-07, L-11, L-14, L-16, L-17, L-20, L-21, L-23, L-24 | All fixed · L-23 runs via `cloudflare-ufw.sh` after L-22     |
| Medium/Low (17) | L-01–L-06, L-08–L-13, L-18, L-25–L-30                | All addressed in code or verified                            |

## Operator checklist (production)

```bash
# Deploy latest main, then:
VERIFY_BASE_URL=https://vibemusic.in npm run check:edge      # L-22
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
npm run audit:deps                                            # L-20 (release-ready includes this)
REQUIRE_CDN_EDGE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff  # L-22 strict
# Optional: LIGHTHOUSE_BASE_URL=... npm run check:cwv         # L-14 (needs running server)
# Optional: k6 run -e BASE_URL=https://vibemusic.in scripts/k6/smoke.js  # L-25
```

Set `NEXT_PUBLIC_GSTIN` and `NEXT_PUBLIC_LEGAL_ENTITY_NAME` in production env for L-30.

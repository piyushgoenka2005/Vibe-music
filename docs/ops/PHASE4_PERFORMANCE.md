# Phase 4 — Performance verification (L-01, L-08, L-11, L-12, L-14)

Last verified: 2026-09-25.

## Finding status

| ID   | Severity | Verdict      | Evidence                                                                                             |
| ---- | -------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| L-01 | Medium   | **Verified** | `Marquee` clone `aria-hidden`; `HomepageProductGridSection` clone; `Marquee.test.tsx`                |
| L-08 | Medium   | **Verified** | `buildProductSlug` dedupes brand tokens; `slug.test.ts`                                              |
| L-11 | High     | **Verified** | `clampHomepageMaxItems` caps product sections at 8; dynamic imports + error boundaries on `HomePage` |
| L-12 | Medium   | **Verified** | `DealProductCard` uses `HomepageProductImage` + `sizes`; `DealProductCard.test.tsx`                  |
| L-13 | Low      | **Verified** | Preconnect hints in `layout.tsx` (unchanged)                                                         |
| L-14 | High     | **Verified** | `check:cwv` (CI/local build) + `check:cwv:strict` (90+ prod target)                                  |

## Lighthouse gates

| Script                     | Perf min | A11y / BP / SEO min | When                                          |
| -------------------------- | -------- | ------------------- | --------------------------------------------- |
| `npm run check:cwv`        | 55       | 90                  | Local prod build (`build` + `start`)          |
| `npm run check:cwv:strict` | 90       | 90                  | Post-deploy on `vibemusic.in` with CDN (L-22) |

```bash
npm run build && npm run start
# separate terminal:
LIGHTHOUSE_BASE_URL=http://127.0.0.1:3000 npm run check:cwv

# Production (after Cloudflare):
LIGHTHOUSE_BASE_URL=https://vibemusic.in npm run check:cwv:strict
```

Performance 90+ on production depends on **L-22 CDN**, image CDN (`cdn.vibemusic.in`), and prod build — not dev mode.

## L-11 homepage caps

| Layout                                                     | Max items (enforced) |
| ---------------------------------------------------------- | -------------------- |
| `product_carousel`, `deals_slider`, `product_grid`         | 8                    |
| `brand_strip`                                              | 12                   |
| `category_grid`, `browse_category_cards`, `category_bento` | 12                   |

CMS rows above these limits are clamped in `homepageService.resolveSection`.

## Phase 4 score

- **Code performance posture:** 9/10
- **Measured CWV on live prod:** Not verified this session (needs deploy + `check:cwv:strict`)

Proceed to **Phase 5 — Convert drawbacks to strengths** (marketing USP list).

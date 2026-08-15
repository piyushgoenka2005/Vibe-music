# Product Image Zoom / Cropping — Audit Report

**Date:** 15 August 2026  
**Status:** Root cause confirmed; CSS fix implemented

---

## Executive summary

The client-reported “zoomed in” product images were **not** caused by `object-fit: cover` or CDN cropping. The primary cause was **intentional resting `transform: scale()`** (1.2 on homepage cards, 1.16–1.22 on PDP) applied inside `overflow: hidden` square wells **after** `object-fit: contain`.

Production asset analysis of 12 catalog images shows **average product occupancy 28.2%** with **0%** tight crops (≥85% occupancy). Source framing is a secondary factor at most.

---

## Root cause classification

| ID | Cause | Verdict |
|----|--------|---------|
| **E** | CSS `transform: scale()` at rest | **PRIMARY** |
| **A** | Inconsistent source image whitespace | Secondary (low impact on current catalog) |
| **C** | Wrong `object-fit` | Ruled out (`contain` is correct) |
| **G** | CDN crop | Ruled out (`fit: inside` only) |
| **H** | Carousel scaling | Same as E (shared scale tokens) |

---

## Image pipeline

```
Admin upload → Sharp (master ≤2000px + w240/480/960/1600 WebP, fit inside)
            → DB products.image / images[]
            → storefrontImageUrl() → CDN derivative or /api/media/thumb
            → <img> + object-fit: contain
            → [FIXED] transform: scale(1) at rest; hover 1.05–1.06
```

---

## Production asset sample (12 products)

See [`product-image-framing-report.csv`](./product-image-framing-report.csv).

| Metric | Value |
|--------|-------|
| Samples analyzed | 12 |
| Average occupancy | 28.2% |
| High occupancy (≥85%) | 0 (0%) |
| Conclusion | CSS resting scale was the dominant issue |

Re-run analysis:

```bash
npx tsx scripts/ops/analyze-product-image-framing.mts --limit 20
BASE_URL=https://vibemusic.in npx tsx scripts/ops/analyze-product-image-framing.mts
```

---

## Fix implemented

### Shared tokens ([`src/styles/product-image-tokens.css`](../../src/styles/product-image-tokens.css))

- `--product-image-scale-rest: 1`
- `--product-image-scale-hover: 1.05`
- `--product-image-scale-hover-strong: 1.06`
- `--pdp-gallery-photo-scale: 1`
- `--product-image-well-padding: clamp(0.5rem, 1.2vw, 0.75rem)`

### Files updated

- [`src/styles/premium-home.css`](../../src/styles/premium-home.css) — removed 1.2/1.32/1.36 resting scale vars
- [`src/styles/premium-product-carousel.css`](../../src/styles/premium-product-carousel.css) — photo-pop uses rest 1.0, hover 1.06
- [`src/components/product/product-detail.css`](../../src/components/product/product-detail.css) — PDP scale 1.0; padding token
- [`src/styles/mobile-storefront.css`](../../src/styles/mobile-storefront.css) — aligned mobile overrides
- [`src/components/category/category.css`](../../src/components/category/category.css) — well padding token
- [`src/app/globals.css`](../../src/app/globals.css) — imports product-image-tokens
- [`src/components/common/ProductImage.tsx`](../../src/components/common/ProductImage.tsx) — shared primitive
- [`src/components/homepage/HomepageProductImage.tsx`](../../src/components/homepage/HomepageProductImage.tsx) — uses ProductImage

### Not changed (by design)

- PDP Amazon-style hover zoom lens (`ProductGallery.tsx`) — interaction only
- CDN upload `fit: inside` — no crop at upload
- Wishlist/cart thumb `cover` — small 72px thumbs (separate surfaces)

### Catalog derivative backfill

**Deferred.** Asset audit did not justify server-side catalog thumbnail normalization.

---

## Validation checklist

- [ ] Homepage carousel — product not clipped at rest
- [ ] New arrivals / deals — subtle hover only
- [ ] Category / search grid — consistent padding
- [ ] PDP main image — no resting zoom; lens on hover
- [ ] Mobile 375px / desktop 1280px
- [ ] `npm run type-check && npm test && npm run build`

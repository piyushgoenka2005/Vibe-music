# PDP Mobile Audit Report — ViBE Music

**Date:** 2026-07-09  
**Scope:** Product Detail Page (`/product/[slug]`) — responsive layout & UX only  
**Breakpoint focus:** 320px–768px (phones + small tablets)

---

## Executive Summary

The PDP had a solid desktop foundation but several mobile-specific failures: overlapping purchase controls, zoom lens behavior conflicting with touch, a sticky bar missing Buy Now, orphaned CSS selectors, double horizontal padding, and recommendation grids that overflowed narrow viewports. This audit documents those issues and the fixes applied in this pass.

---

## Issues Found

### Critical (usability)

| # | Area | Issue |
|---|------|-------|
| 1 | Sticky purchase bar | Only showed **Add to Cart**; **Buy Now** missing when scrolled past actions |
| 2 | Sticky bar stacking | Rendered in-page (not portaled); risk of z-index / transform conflicts |
| 3 | Gallery touch | Desktop zoom lens activated on touch without zoom pane on mobile — confusing overlay |
| 4 | Lightbox | Safe-area CSS targeted `.pdp-lightbox__image` but markup uses `.pdp-lightbox__photo` |
| 5 | Cross-sell overflow | `responsive-utilities.css` targeted non-existent `.pdp-cross-sell__grid` — no overflow guard |

### High (layout)

| # | Area | Issue |
|---|------|-------|
| 6 | Horizontal overflow | `.pdp` lacked `overflow-x: clip` on narrow screens |
| 7 | Double padding | `.pdp-info` had inner padding while `.storefront-page .pdp` already padded — cramped layout |
| 8 | Related products | `minmax(220px, 1fr)` grid caused squeeze/overflow at 320–390px |
| 9 | Guitar extensions | Rendered outside `.pdp` shell — inconsistent horizontal alignment on mobile |
| 10 | SSR hydration | `useIsMobileViewport` defaulted `true` on server — sticky bar flash risk |

### Medium (UX polish)

| # | Area | Issue |
|---|------|-------|
| 11 | Pincode checker | Row layout too tight; inputs below 44px touch target |
| 12 | Q&A / review forms | Inputs at 14px triggered iOS zoom; submit buttons not full-width |
| 13 | Specs tables | Already stacked at ≤767px — verified working |
| 14 | Trust badges | CSS referenced `.pdp-trust-carousel__arrow` but component uses `.pdp-trust__arrow` |
| 15 | Lightbox navigation | No prev/next controls; swipe only |

### Low / deferred

| # | Area | Issue |
|---|------|-------|
| 16 | Pinch-to-zoom in lightbox | Not implemented (native pinch works in some browsers on image) |
| 17 | Tablet 768–1023px | Two-column PDP remains; acceptable for tablet landscape |
| 18 | Automated PDP route in `scripts/mobile-audit.mjs` | Not in scope for this pass |

---

## Components Audited

- ProductGallery, ProductInfo, ProductStickyBar, ShippingEstimator
- ProductTabs (Description, Specs, Reviews, Q&A, Videos)
- ProductTrustBadges, FrequentlyBoughtTogether, ProductCrossSell
- Reviews module (10 files), Q&A module (2 files)
- GuitarSpecShowcase, GuitarTonesInMotion, GuitarStorySections (guitar PDP only)
- Breadcrumbs, share/wishlist controls

---

## Validation

| Check | Result |
|-------|--------|
| `npm run type-check` | Pass |
| `npm run lint` | Pass (no new errors) |
| `npm run build` | Pass |

---

## Remaining Recommendations

1. Add `/product/[slug]` to `scripts/mobile-audit.mjs` for automated regression checks.
2. Consider tablet-specific sticky bar at 768–1023px if analytics show high tablet checkout share.
3. Optional: pinch-zoom library in lightbox for iOS Safari consistency.
4. Split `product-detail.css` mobile rules into a single consolidated `@media (max-width: 767px)` block in a future refactor (currently multiple blocks — functional but duplicated).

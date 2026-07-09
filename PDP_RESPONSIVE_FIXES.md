# PDP Responsive Fixes — Implementation Log

**Date:** 2026-07-09  
**Principle:** Responsive behavior only — no visual rebrand, no backend changes.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/product/ProductStickyBar.tsx` | Portaled to `document.body`; dual CTA (Add to Cart + Buy Now); slide-in animation; `useIsClient` for hydration-safe portal |
| `src/components/product/ProductDetailPage.tsx` | Passes `onBuyNow` to sticky bar; guitar sections wrapped in `.pdp.pdp--guitar-extensions` |
| `src/components/product/ProductGallery.tsx` | Disabled zoom lens on mobile touch; tap-to-lightbox; lightbox swipe + prev/next nav |
| `src/components/product/product-detail.css` | Overflow clip; lightbox nav; premium sticky bar layout; cross-sell carousel; shipping/Q&A/forms mobile; removed duplicate `.pdp-info` padding |
| `src/styles/storefront-pages.css` | Updated PDP bottom padding for dual-button bar; removed redundant `.pdp-info` padding |
| `src/styles/mobile-storefront.css` | Fixed lightbox photo safe-area selector (`.pdp-lightbox__photo`) |
| `src/styles/responsive-utilities.css` | Fixed cross-sell overflow target (`.pdp-cross-sell`) |
| `src/styles/product-reviews.css` | Mobile form touch targets, full-width submit, filter stacking |
| `src/hooks/useIsMobileViewport.ts` | SSR default `false` (was `true`) to prevent hydration mismatch |

---

## Fix Details

### 1. Sticky mobile purchase bar

**Before:** Single Add to Cart button, in React tree, instant show/hide.  
**After:**
- Price + stock label on left
- **Add to Cart** + **Buy Now** side-by-side (44px min height)
- `createPortal(..., document.body)` — matches checkout bar pattern
- `translateY` slide animation with `prefers-reduced-motion` fallback
- Page `padding-bottom: 6.25rem + safe-area` so content is never covered

### 2. Product gallery (mobile)

**Before:** Touch activated zoom lens with no magnifier pane.  
**After:**
- Zoom lens hidden on ≤767px (`display: none !important`)
- Touch swipe between images (48px threshold)
- Short tap opens fullscreen lightbox
- Lightbox: prev/next buttons + swipe between images
- Images constrained to viewport (`max-width: 100%`, `object-fit: contain`)

### 3. Purchase panel

**Before:** Actions could feel cramped due to nested padding.  
**After:**
- `.pdp-info { padding: 0 }` on mobile — outer `.pdp` handles gutters
- Full-width Add to Cart / Buy Now / Wishlist (existing `storefront-pages.css` rules preserved)
- Quantity input `font-size: 16px` (prevents iOS auto-zoom)
- Rating row wraps on narrow screens
- Availability badge wraps full width

### 4. Specifications

Existing stacked card layout at ≤767px retained:
- `th` / `td` display block
- Label above value per row

### 5. Reviews & Q&A

- Review summary single column on mobile
- Filter bar stacked
- Form inputs 16px / 44px min height
- Full-width submit buttons
- Q&A form padding reduced; textarea 16px font

### 6. Recommendations (Similar / Related / FBT)

- **Cross-sell:** horizontal scroll carousel (`scroll-snap`, `min(72vw, 260px)` cards)
- **FBT:** horizontal strip with `flex-shrink: 0` cards (existing + alignment fix)

### 7. Shipping / pincode

- Pincode row stacks vertically on mobile
- Input + button full width, 44px min height, 16px font

### 8. Guitar PDP sections

Wrapped in `.pdp.pdp--guitar-extensions` so padding/max-width matches main PDP shell.

---

## Before / After (Behavioral)

| Scenario | Before | After |
|----------|--------|-------|
| Scroll past Buy Now on iPhone | Sticky bar: price + ATC only | Price + ATC + Buy Now |
| Swipe product image | Sometimes showed zoom lens box | Clean swipe; lens hidden |
| Tap product image | Lightbox | Lightbox + nav arrows |
| 320px related products | Grid squeeze / overflow | Horizontal swipe carousel |
| Pincode check on mobile | Cramped side-by-side row | Stacked full-width fields |
| Guitar specs below fold | Full-bleed misalignment | Aligned with PDP gutters |

*Screenshots: capture manually on device after hard-refresh at `/product/[any-slug]`.*

---

## Components Updated (TSX)

- `ProductStickyBar.tsx`
- `ProductDetailPage.tsx`
- `ProductGallery.tsx`

All other PDP components benefited from CSS-only fixes without logic changes.

# ViBE Music — Responsive Audit Report

**Date:** 2026-07-09  
**Scope:** Full storefront + admin + GP-9 codebase  
**Method:** Code-verified static audit (48 App Router pages, 6 layouts, ~59 CSS files, 21 component groups)

---

## Executive Summary

The ViBE Music codebase has a **solid responsive foundation** (`tokens.css`, `mobile-storefront.css`, global `overflow-x: clip`, safe-area padding, fluid `clamp()` typography) but suffers from **fragmented breakpoint usage** across ~60 CSS files. Primary risks: `100vw` full-bleed sections, inconsistent drawer widths, duplicate `@media` blocks in large files, and a **768–1023px tablet gap** where drawer nav is active while many sections retain desktop layouts.

---

## Breakpoint Conventions Found

| Token (documented) | Value | Actual usage |
|---|---|---|
| `--bp-sm` | 640px | Mixed: 639px / 640px |
| `--bp-md` | 768px | Mixed: 767px max / 768px min |
| `--bp-lg` | 1024px | Mixed: 1023px max / 1024px min |
| `--bp-xl` | 1280px | Consistent |

**JS hooks:** `useIsMobileViewport` at 767px; `useCompactHeaderNav` at 1023px.

---

## Components Audited

### Storefront (48 routes)
- Home, PDP, PLP/category, cart, checkout, search, account (7), auth (3), deals, brands, compare, blog, CMS pages, track-order, GP-9, error/loading states

### Layout & Chrome
- `SiteHeader`, `SiteHeaderNav`, `HeaderMegaMenu`, `SiteFooter`, `SocialRail`, `HelpWidget`, `AppShell`, `StorefrontChrome`

### Homepage Sections
- Banner hero, category bento, gear stories/reels, hero showcase, find-your-product scanner, deals, brands, blog teaser, newsletter, culture typography, why-shop, service status carousel

### Commerce Flows
- Cart drawer, wishlist drawer, checkout (address/payment/swipe), order resume payment, invoice redirect

### Admin (17 routes)
- Dashboard, products, categories, orders, customers, inventory, coupons, banners, homepage CMS, blog, reviews, analytics, settings

---

## Top Issues Found (Priority Order)

| # | Area | Issue | Severity |
|---|---|---|---|
| 1 | `premium-home.css`, `homepage-banner-hero.css` | `100vw` full-bleed heroes risk horizontal scrollbar | High |
| 2 | `wishlist.css` | Drawer used raw `100vw` vs cart `100dvw` | High |
| 3 | `site-layout.css` | 3× duplicate `@media (max-width: 767px)` blocks | Medium |
| 4 | Tablet 768–1023px | Drawer nav + desktop section layouts mismatch | Medium |
| 5 | `product-detail.css` | FBT strip fixed widths + horizontal scroll | Medium |
| 6 | `gear-stories.css` | Tall reel cards on narrow phones | Medium |
| 7 | `find-your-product.css` | `min-width` + `nowrap` on scanner cards | Medium |
| 8 | `admin/*.tsx` pages | Heavy inline `style={{}}` bypasses `admin.css` | Medium |
| 9 | `account.css` | 5× duplicate 767px blocks | Low |
| 10 | Breakpoint inconsistency | 479 vs 480, 639 vs 640, 767 vs 768 | Low |

---

## Files With Dedicated Responsive CSS (OK)

| Area | CSS |
|---|---|
| Global shell | `globals.css`, `site-layout.css`, `site-footer.css` |
| Mobile fixes | `mobile-storefront.css` |
| Homepage | `premium-home.css`, `homepage-banner-hero.css`, section CSS via bundle |
| PDP | `product-detail.css`, `product-reviews.css` |
| PLP | `category.css`, `filters.css` |
| Cart/Checkout | `cart.css`, `checkout.css` |
| Account | `account.css` |
| Search | `search.css` |
| Admin | `admin.css` |
| Auth | `auth.css` |

---

## Areas Needing Further Work (Not Fully Remediated)

1. **Consolidate duplicate `@media` blocks** in `premium-home.css` (~4400 lines), `site-layout.css`, `account.css`
2. **Admin page inline styles** — migrate to CSS classes for responsive grids/tables
3. **Standardize breakpoints** to token values (640/768/1024/1280) project-wide
4. **Tablet-specific layouts** (768–1023px) for checkout, category grids, PDP two-column
5. **GP-9** uses `768px` vs storefront `767px` — align conventions

---

## Audit Statistics

| Metric | Count |
|---|---|
| App Router pages | 48 |
| Layouts | 6 |
| CSS files | ~59 |
| Component groups | 21 |
| `@media` queries (approx.) | 200+ across codebase |
| Critical overflow risks | 15 identified |
| Issues fixed this pass | 12 (see RESPONSIVE_FIXES_REPORT.md) |

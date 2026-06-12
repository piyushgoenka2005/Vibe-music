# Product Data Migration Report

**Date:** 2026-06-12  
**Task:** Centralize storefront product catalog from hardcoded TypeScript into JSON + `catalogService`

---

## Step 1 — Pre-Migration Audit

### Canonical Storefront Catalog (39 products)

| File Path | Data Found | Product Count |
|-----------|------------|---------------|
| `src/data/products.ts` | `RAW[]` hardcoded product array with USD prices, converted to INR | **39** |
| `src/data/productDetails.ts` | Enrichment logic (SKU, specs, reviews, variants, cross-sells) derived from `PRODUCTS` | **39** (derived) |
| `src/data/productImages.ts` | Image URL mapping by slug/category | **39** (lookup) |
| `src/data/categories.ts` | Categories from `POPULAR_CATEGORIES` + product counts from `PRODUCTS` | **14 categories** |
| `src/lib/server/productRepository.ts` | Firestore `products` collection (storefront API) | Variable (bypassed) |

### Category Page Flow (pre-migration)

| File Path | Data Found | Notes |
|-----------|------------|-------|
| `src/components/category/CategoryPage.tsx` | No inline mocks | Uses `useCategoryProducts` hook |
| `src/services/category.service.ts` | Filter/sort/pagination | Called `fetchProducts()` → `/api/products` → Firestore |
| `src/services/products.api.ts` | HTTP client | Fetched from API, not inline |

### Product Detail Page Flow (pre-migration)

| File Path | Data Found | Product Count |
|-----------|------------|---------------|
| `src/app/product/[slug]/page.tsx` | Static params from `getAllProductSlugs()` | **39** |
| `src/services/product.service.ts` | `getProductDetailBySlug` from `productDetails.ts` | **39** |
| `src/components/product/ProductDetailPage.tsx` | No inline mocks | Uses `fetchProductDetail` service |

### Additional Mock Data (homepage / search — not migrated)

These files contain **separate** promotional carousel data with different IDs/prices. They were **not migrated** to preserve homepage UI exactly.

| File Path | Data Found | Product Count |
|-----------|------------|---------------|
| `src/data/suggestedProducts.ts` | Suggested carousel items | ~12 |
| `src/data/hottestDeals.ts` | Hottest deals carousel | ~8 |
| `src/data/hottestDealsDynamic.ts` | Dynamic deals carousel | ~8 |
| `src/data/topNewProducts.ts` | Top new products carousel | ~6 |
| `src/data/suggestedGXProducts.ts` | Gear Exchange suggestions | ~6 |
| `src/data/searchCatalog.ts` | Search fallback catalog | **25** |
| `src/components/sections/RecommendedProducts/RecommendedProducts.tsx` | Inline hardcoded array | **4** |

### Cart / Wishlist / Sitemap Consumers

| File Path | Data Found |
|-----------|------------|
| `src/components/cart/CartPage.tsx` | `PRODUCTS` lookup for enrichment |
| `src/components/cart/CartItem.tsx` | `PRODUCTS` lookup |
| `src/store/wishlistStore.ts` | `PRODUCTS` lookup |
| `src/app/sitemap.ts` | `PRODUCTS` for product URLs |

---

## Step 4 — Migration Summary

All **39 canonical storefront products** migrated to JSON with full detail payloads preserved:

- Pricing (INR, including sale/MSRP logic)
- Ratings & review counts
- Availability & condition
- Image URLs & gallery metadata
- Specifications, variants, reviews, Q&A
- Cross-sell / similar / related product IDs

### Product Distribution by Category File

| JSON File | Category Slug | Products |
|-----------|---------------|----------|
| `categories/guitars.json` | `guitars` | 20 |
| `categories/drums.json` | `drums-percussion` | 5 |
| `categories/microphones.json` | `microphones-wireless` | 3 |
| `categories/studio-recording.json` | `studio-recording` | 2 |
| `categories/keyboards.json` | `keyboards-synthesizers` | 2 |
| `categories/pa-live-sound.json` | `live-sound-lighting` | 2 |
| `categories/home-audio-electronics.json` | `home-audio-electronics` | 2 |
| `categories/software-plug-ins.json` | `software-plug-ins` | 2 |
| `categories/dj-equipment.json` | `dj-equipment` | 1 |
| `categories/bass.json` | `bass` | 0 |
| `categories/band-orchestra.json` | `band-orchestra` | 0 |
| `categories/accessories.json` | `cables-cases-accessories` | 0 |
| `categories/commercial-audio-installation.json` | `commercial-audio-installation` | 0 |
| `categories/video-cameras.json` | `video-cameras` | 0 |

### Curated Lists

| File | Count | Selection Logic |
|------|-------|-----------------|
| `featured-products.json` | 8 | Every 5th product (`index % 5 === 0`) |
| `trending-products.json` | 10 | Top 10 by review count |
| `new-arrivals.json` | 6 | Last 6 products in catalog order |
| `brands.json` | 29 | Unique brands from catalog |

---

## Totals

| Metric | Count |
|--------|-------|
| **Total Products** | **39** |
| **Total Categories** | **14** |
| **Total Brands** | **29** |

---

## Files Created

```
src/data/catalog/
├── categories.json
├── brands.json
├── featured-products.json
├── trending-products.json
├── new-arrivals.json
└── categories/
    ├── guitars.json
    ├── studio-recording.json
    ├── drums.json
    ├── bass.json
    ├── keyboards.json
    ├── pa-live-sound.json
    ├── software-plug-ins.json
    ├── dj-equipment.json
    ├── microphones.json
    ├── band-orchestra.json
    ├── home-audio-electronics.json
    ├── commercial-audio-installation.json
    ├── accessories.json
    └── video-cameras.json

src/services/catalogService.ts
src/types/catalog.ts
src/types/brand.ts
scripts/validate-catalog.mts
```

---

## Files Refactored

| File | Change |
|------|--------|
| `src/data/products.ts` | Thin re-export via `catalogService.getAllProducts()` |
| `src/data/productDetails.ts` | Re-exports from `catalogService` |
| `src/data/categories.ts` | Re-exports from `catalogService` |
| `src/services/category.service.ts` | Uses `getProductsByCategory()` instead of Firestore API |
| `src/services/product.service.ts` | Uses `catalogService` for PDP data |
| `src/lib/server/productRepository.ts` | Delegates to `catalogService.searchProducts()` |
| `src/types/product.ts` | Re-exports `CatalogProduct` schema types |

---

## Validation

| Check | Result |
|-------|--------|
| `npm run type-check` | ✅ Pass |
| `npm run build` | ✅ Pass (103 static pages, 39 product routes) |
| `npm run lint` | ⚠️ Pre-existing checkout errors (unchanged by this migration) |
| `npx tsx scripts/validate-catalog.mts` | ✅ 39 products validated |

---

## UI Impact

**None.** Category pages, product detail pages, cart enrichment, wishlist, and sitemap render identical data — only the data source changed from hardcoded TypeScript / Firestore to JSON via `catalogService`.

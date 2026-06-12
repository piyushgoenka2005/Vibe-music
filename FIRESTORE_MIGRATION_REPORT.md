# Firestore + Cloudinary Migration Report

Migration completed: JSON catalog → Firebase Firestore (primary data) + Cloudinary (new image uploads only).

---

## 1. Firestore Collections Structure

### `products`
| Field | Type | Notes |
|-------|------|-------|
| id | string | Document ID |
| slug | string | Unique, indexed |
| sku | string | Unique, indexed |
| name, brand, category, subcategory | string | |
| brandSlug, categorySlug | string | Used for dynamic category/brand queries |
| price, originalPrice, discountPercentage | number | |
| stock / stockQuantity | number | Both stored for compatibility |
| status | active \| draft \| archived | |
| featured, trending, newArrival | boolean | Dynamic homepage/listing flags |
| images | string[] | **URLs only** — local paths or Cloudinary |
| image | string | Primary thumbnail |
| description, specifications | string / object | |
| rating, reviewCount | number | |
| availability, condition, imageColor, gstRate | mixed | Preserved from legacy schema |
| detail | object | PDP enrichment (gallery, related IDs, etc.) |
| createdAt, updatedAt | ISO string | Sorted desc for listings |

### `categories`
| Field | Type |
|-------|------|
| id | string |
| name | string |
| slug | string |
| description | string |

### `brands`
| Field | Type |
|-------|------|
| id | string |
| name | string |
| slug | string |

**Security rules:** All writes via Admin SDK only. Public read on `products`, `categories`, `brands`.

---

## 2. Cloudinary Upload Architecture

```
Admin UI (ProductImageUpload / Bulk Import)
        ↓ multipart POST
/api/admin/upload/images  OR  /api/admin/products/import
        ↓ server-only
src/lib/cloudinary.ts
  • configureCloudinary() — signed API credentials
  • uploadBufferToCloudinary(buffer, filename, { folder })
  • categoryUploadFolder(categorySlug) → products/{category-slug}/
        ↓
Cloudinary CDN → secure_url returned
        ↓
Firestore products.images[] — URL strings only
```

**Env vars:**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Important:** Existing migrated products keep original `/images/...` URLs. Cloudinary is used only for **new** admin uploads and bulk import ZIP images.

---

## 3. CSV Import Architecture

```
BulkImportModal
  ├── CSV file (required)
  └── ZIP file (optional — image filenames)
        ↓
POST /api/admin/products/import
  1. parseCsv() → BulkImportRow[]
  2. Extract ZIP → Map<filename, Buffer>
  3. For each row:
     - URL paths (http/https//) → use as-is
     - Filenames → upload to Cloudinary → resolvedImages[]
  4. previewBulkImport() — validate required fields, category, SKU/slug dupes, images
  5. confirm=true → bulkImportProducts() → createProduct() per valid row
        ↓
Import report: imported / skipped / errors + failed rows CSV download
```

**CSV columns:** name, brand, category, subcategory, price, originalPrice, stock, sku, description, featured, trending, newArrival, image1–image5

Template: `public/product-import-template.csv`

---

## 4. ZIP Image Processing Flow

```
images.zip
  ├── fender1.jpg
  ├── fender2.jpg
  └── ibanez1.jpg
        ↓
AdmZip extracts entries (jpg/png/webp/gif)
        ↓
CSV row: image1=fender1.jpg, image2=fender2.jpg
        ↓
Match filename (case-insensitive) in zipMap
        ↓
uploadBufferToCloudinary → products/{categorySlug}/fender1
        ↓
resolvedImages: ["https://res.cloudinary.com/.../fender1.jpg", ...]
        ↓
Stored in Firestore products.images[]
```

Validation: rows with filename references but missing ZIP entries are flagged in preview.

---

## 5. Files Created

| File | Purpose |
|------|---------|
| `src/lib/firebase.ts` | Unified Firebase entry (client + admin re-exports) |
| `src/lib/cloudinary.ts` | Signed uploads, folder helpers |
| `src/lib/server/firestoreCatalogRepository.ts` | Firestore CRUD, cache, batch ops |
| `src/app/api/admin/upload/images/route.ts` | Multi-image Cloudinary upload API |
| `src/components/admin/ProductImageUpload.tsx` | Drag/drop image upload UI |
| `scripts/migrate-products-to-firestore.ts` | JSON → Firestore migration |
| `firestore.indexes.json` | Composite indexes for scale |
| `FIRESTORE_MIGRATION_REPORT.md` | This document |

---

## 6. Files Modified

| File | Change |
|------|--------|
| `src/services/catalogService.ts` | Async Firestore backend (replaces JSON) |
| `src/lib/server/adminProductService.ts` | Async + images[] support |
| `src/lib/server/productRepository.ts` | Async catalog reads |
| `src/lib/server/inventoryService.ts` | Async product ops |
| `src/lib/server/orderValidation.ts` | Async getProductById |
| `src/lib/server/dashboardService.ts` | Async product counts |
| `src/lib/server/reviewService.ts` | Async seed loop |
| `src/lib/server/categoryRepository.ts` | Async getAllProducts |
| `src/components/admin/ProductFormPage.tsx` | ProductImageUpload integration |
| `src/components/admin/BulkImportModal.tsx` | CSV + ZIP upload |
| `src/app/api/admin/products/import/route.ts` | ZIP parsing + Cloudinary upload |
| `src/lib/csv.ts` | image4, image5 columns |
| `src/lib/validations/admin.ts` | images[] schema |
| `src/types/catalog.ts`, `category.ts` | Firestore comments |
| `src/app/sitemap.ts`, category/product API routes | Async catalog |
| `src/components/admin/admin.css` | Upload zone styles |
| `.env.example` | Cloudinary vars |
| `firestore.rules` | brands collection read rule |
| `package.json` | migrate:products script |
| `scripts/seed-products.mts` | Reads products.json (deprecated in favor of migrate) |
| `public/product-import-template.csv` | Updated columns |

**Deleted:** `src/data/products.ts` (JSON shim no longer needed)

---

## 7. Migration Summary

**Run migration (one-time):**
```bash
npm run migrate:products
```

This reads:
- `src/data/catalog/products.json` (~40 products)
- `src/data/catalog/categories.json` (14 categories)
- `src/data/catalog/brands.json` (or derives from products)

Writes to Firestore with **existing image URLs preserved** (no Cloudinary upload).

Report written to `migration-report.json` after run.

**Deploy indexes:**
```bash
firebase deploy --only firestore:indexes
```

---

## 8. Validation Results

| Check | Result |
|-------|--------|
| `npm run type-check` | ✅ Pass |
| `npm run build` | ✅ Pass (68 routes) |
| `npm run lint` | ⚠️ Pre-existing warnings in checkout/UI; 1 migration-related error fixed (`prefer-const` in catalogService) |

---

## Architecture Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Storefront UI  │────▶│  catalogService  │────▶│    Firestore    │
│  (unchanged)    │     │  (async/server)  │     │  products       │
└─────────────────┘     └──────────────────┘     │  categories     │
         │                        ▲               │  brands         │
         │                        │               └─────────────────┘
┌─────────────────┐     ┌────────┴─────────┐
│   Admin Panel   │────▶│ adminProductService│
│  (unchanged UI) │     └────────┬─────────┘
└────────┬────────┘              │
         │              ┌────────▼─────────┐
         │              │  New uploads only │
         └─────────────▶│    Cloudinary     │
                        │ products/{cat}/   │
                        └───────────────────┘
```

---

## Post-Migration Checklist

1. Set Firebase Admin + Cloudinary env vars in `.env.local`
2. Run `npm run migrate:products`
3. Deploy `firestore.indexes.json`
4. Verify storefront category pages load products from Firestore
5. Test admin: create product with image upload → confirm Cloudinary URL in Firestore
6. Test bulk import with CSV + ZIP

**Future PostgreSQL transition:** UI reads through `catalogService` abstraction — swap `firestoreCatalogRepository` for a Postgres repository without frontend changes.

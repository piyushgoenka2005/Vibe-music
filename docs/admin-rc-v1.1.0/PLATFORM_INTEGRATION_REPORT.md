# Platform Integration Report — Admin ↔ Storefront

**Date:** 2026-07-27  
**Method:** Service/repository trace (code verification, not live browser)

---

## Integration map

| Domain | Admin write path | Storefront read path | Consistency |
|--------|------------------|----------------------|-------------|
| Products | `adminProductService` → `catalogService` / Prisma | `storeCatalogRepository`, `catalogRepository` | **Shared Prisma `Product` model** |
| Inventory | `api/admin/inventory` POST → stock adjust | PDP/cart stock checks via catalog | **Same `stockQuantity` fields** |
| Categories / brands | `api/admin/categories`, `brands` | `categoryResolver`, search filters | **Shared tables** |
| Coupons | `api/admin/coupons` | `couponMath`, checkout apply | **Same `Coupon` model** |
| Orders | `api/admin/orders` status/refund | Account orders, emails | **Same `Order` model** |
| Shipping | `api/admin/shipping-zones` | `shippingQuoteService` (storefront forces free today) | **Zones stored; checkout quote logic separate** |
| Blog | `api/admin/blog` | `/blog`, `blogEngine` | **Published status gate on storefront** |
| CMS | `api/admin/cms/pages` | Content pages by slug | **DB override over seed JSON** |
| Homepage | `api/admin/homepage`, banners | `homepage` loaders, banner carousel | **Section/item tables drive homepage** |
| Reviews | `api/admin/reviews` approve/reject | PDP reviews when `approved` | **Status filter on storefront** |
| Questions | `api/admin/questions` | PDP Q&A when `approved` | **Status filter** |
| Search analytics | `api/admin/analytics/search` | Search event logging | **Read-only analytics** |
| Rentals / giveaways | Admin rental/giveaway APIs | `/rentals`, `/giveaway` | **Dedicated Prisma models** |

---

## Verified propagation mechanisms

1. **Prisma as single write model** — Admin mutations persist to Postgres; storefront reads same tables (or JSON fallback in dev).
2. **Status gates** — `draft`/`archived` products, unpublished blog, inactive banners filtered on storefront loaders.
3. **Homepage curation** — `HomepageSection` / `HomepageSectionItem` read by storefront homepage services.
4. **Inventory adjustments** — Admin POST adjusts quantity; cart/checkout use live stock from catalog.
5. **Restock notifications** — `adminProductService` triggers `notifyWaitlistOnRestock` on stock changes.

---

## Known integration gaps (evidence)

| Gap | Evidence | Impact |
|-----|----------|--------|
| Dual `products.json` | Root vs `src/data/catalog/products.json` drift (enterprise DD) | JSON fallback only; Postgres is source of truth in prod |
| Shipping settings vs checkout | Settings page notes storefront forces ₹0 shipping | Admin shipping zones exist but checkout quote overridden |
| Build-time catalog | Category SSG needs DB or `ALLOW_JSON_CATALOG_FALLBACK` | Deploy/config, not admin mutation |

---

## Admin mutation → storefront test status

| Flow | Automated E2E | Code trace |
|------|---------------|------------|
| Publish product → appears in search | Not run | ✓ shared DB |
| Approve review → PDP | Not run | ✓ status filter |
| Activate banner → homepage | Not run | ✓ banner service |
| Coupon create → checkout | Not run | ✓ coupon repository |

---

## Certification status

**Integration architecture: PASS** (shared persistence + status gates).  
**Live end-to-end propagation: NOT VERIFIED** in RC Playwright run (no authenticated DB tests).

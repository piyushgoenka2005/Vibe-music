# Category Data Migration Report

**Date:** 2026-06-12  
**Scope:** Category metadata and per-category product listings

---

## Pre-Migration State

| Source | Contents |
|--------|----------|
| `src/lib/constants.ts` → `POPULAR_CATEGORIES` | 14 category names |
| `src/data/categories.ts` | Generated `Category[]` with slug, description, productCount |
| `src/data/popularCategories.ts` | Homepage category tiles (separate presentation data) |
| Category routes | `/category/[slug]` — 14 static paths via `generateStaticParams` |

Category pages did **not** contain inline product arrays. Products were loaded via:

```
CategoryPage → useCategoryProducts → category.service → products.api → /api/products → Firestore
```

---

## Post-Migration State

```
CategoryPage → useCategoryProducts → category.service → catalogService.getProductsByCategory()
                                                              ↓
                                              src/data/catalog/categories/{slug}.json
```

Category metadata:

```
catalogService.getCategories() → src/data/catalog/categories.json
catalogService.getCategoryBySlug(slug) → categories.json lookup
```

---

## Category Slug → JSON File Mapping

| Category Name | Route Slug | JSON File | Products |
|---------------|------------|-----------|----------|
| Guitars | `guitars` | `guitars.json` | 20 |
| Studio & Recording | `studio-recording` | `studio-recording.json` | 2 |
| Drums & Percussion | `drums-percussion` | `drums.json` | 5 |
| Bass | `bass` | `bass.json` | 0 |
| Keyboards & Synthesizers | `keyboards-synthesizers` | `keyboards.json` | 2 |
| Live Sound & Lighting | `live-sound-lighting` | `pa-live-sound.json` | 2 |
| Software & Plug-ins | `software-plug-ins` | `software-plug-ins.json` | 2 |
| DJ Equipment | `dj-equipment` | `dj-equipment.json` | 1 |
| Microphones & Wireless | `microphones-wireless` | `microphones.json` | 3 |
| Band & Orchestra | `band-orchestra` | `band-orchestra.json` | 0 |
| Home Audio & Electronics | `home-audio-electronics` | `home-audio-electronics.json` | 2 |
| Commercial Audio & Installation | `commercial-audio-installation` | `commercial-audio-installation.json` | 0 |
| Cables, Cases & Accessories | `cables-cases-accessories` | `accessories.json` | 0 |
| Video & Cameras | `video-cameras` | `video-cameras.json` | 0 |

**Total categories:** 14  
**Categories with products:** 9  
**Empty category files:** 5 (preserved for future products and routing)

---

## Category Schema (`categories.json`)

```json
{
  "id": "cat-1",
  "name": "Guitars",
  "slug": "guitars",
  "description": "Shop guitars from top brands with expert support and fast shipping.",
  "productCount": 20
}
```

Defined in `src/types/category.ts`.

---

## Routing — Unchanged

All 14 category routes remain identical:

```
/category/guitars
/category/studio-recording
/category/drums-percussion
/category/bass
/category/keyboards-synthesizers
/category/live-sound-lighting
/category/software-plug-ins
/category/dj-equipment
/category/microphones-wireless
/category/band-orchestra
/category/home-audio-electronics
/category/commercial-audio-installation
/category/cables-cases-accessories
/category/video-cameras
```

Build output confirms all 14 SSG category pages generated successfully.

---

## Filter & Facet Behavior — Preserved

`category.service.ts` still applies:

- Brand facets (derived from category products)
- Price range min/max
- Brand, price, rating, availability, condition filters
- Sort: price-asc, price-desc, rating-desc
- Pagination (12 per page)

Data now sourced from JSON instead of Firestore — filter logic unchanged.

---

## Future Database Migration

To swap JSON → Firestore/PostgreSQL for categories:

1. Update `getCategories()` and `getProductsByCategory()` in `catalogService.ts`
2. Keep return types (`Category[]`, `Product[]`) identical
3. No changes required in `CategoryPage`, `category.service.ts`, or route files

Admin category CRUD (`categoryRepository.ts`) remains on Firestore independently for the admin panel.

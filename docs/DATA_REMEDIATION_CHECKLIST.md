# Vibe Music Data Remediation Checklist

**Purpose:** This checklist outlines the data changes required to complete the internal linking and search remediation.

**Reference:** See `AUDIT_HANDOVER_REPORT.md` for full technical details.

---

## Critical Finding Summary

The technical audit found that the **category "Cables, Cases & Accessories" contains no cable products**. It only has 3 stand products (keyboard stand, microphone stand, music stand). This is why "instrument cable" search returns 0 results.

**The search logic has been fixed** (SKU matching, synonyms, relaxed token matching). The issue is **missing product data**, not a search bug.

---

## Required Data Changes

### 1. Import Cable Products (P0 - Critical)

**Status:** ❌ Not Started  
**Owner:** Content/Business Team  
**Dependency:** None

**Action Items:**

- [ ] Gather product data for:
  - Instrument cables (guitar cables, instrument leads)
  - XLR & microphone cables
  - Patch cables (pedal patch cables)
  - Power adapters & power supplies
- [ ] Prepare product CSV with required fields:
  - `name` (product title)
  - `sku` (unique stock keeping unit)
  - `brand` (manufacturer name)
  - `price` (selling price)
  - `category` (should be "Cables" after restructure)
  - `subcategory` (Instrument Cables, XLR & Mic Cables, Patch Cables, Power & Adapters)
  - `description` (product description)
  - `image` (product image URL)
  - `stock` (inventory count)
  - `status` (set to "active")
- [ ] Import products via admin bulk import or API
- [ ] Verify products appear in database
- [ ] Test search for "instrument cable" - should return cable products

**Estimated Time:** 2-4 hours (depending on product count)

---

### 2. Restructure Category Hierarchy (P0 - Critical)

**Status:** ❌ Not Started  
**Owner:** Developer + Business Approval  
**Dependency:** Database backup must be taken first

**Current State:**

- Flat structure with 15 root categories
- "Cables, Cases & Accessories" (cat-13) has 3 stand products, no cable products

**Required Structure (per spec):**

```
Accessories (parent category)
├── Cables (child category)
│   ├── Subcategory: Instrument Cables
│   ├── Subcategory: XLR & Mic Cables
│   ├── Subcategory: Patch Cables
│   └── Subcategory: Power & Adapters
├── Cases & Bags (child category)
│   ├── Subcategory: Guitar Cases
│   ├── Subcategory: Keyboard Bags
│   ├── Subcategory: Rack Cases
│   └── Subcategory: Pedalboards
└── Essentials (child category)
    ├── Subcategory: Stands
    ├── Subcategory: Tuners & Metronomes
    └── Subcategory: Care & Cleaning
```

**Action Items:**

- [ ] Take full PostgreSQL backup
- [ ] Get business approval for category structure
- [ ] Create parent category: "Accessories" (slug: `accessories`)
- [ ] Create child category: "Cables" (slug: `cables`, parentId: accessories.id)
- [ ] Create child category: "Cases & Bags" (slug: `cases-bags`, parentId: accessories.id)
- [ ] Create child category: "Essentials" (slug: `essentials`, parentId: accessories.id)
- [ ] Move existing stand products to "Essentials" category
- [ ] Update product `category` and `categorySlug` fields for all moved products
- [ ] Assign imported cable products to "Cables" category with appropriate subcategories
- [ ] Test category navigation: `/category/accessories/cables/`
- [ ] Test breadcrumbs: Home > Accessories > Cables > Instrument Cables

**Estimated Time:** 4-6 hours (including testing)

**Rollback Plan:** Restore PostgreSQL backup if issues arise

---

### 3. Update Mega Menu Links (P1 - High)

**Status:** ❌ Not Started  
**Owner:** Developer  
**Dependency:** Category hierarchy must be restructured first

**Current State:**

- Mega menu links to search queries: `/search/results?q=instrument+cable&category=cables-cases-accessories`

**Required State:**

- Mega menu links to category pages: `/category/accessories/cables/`

**Action Items:**

- [ ] Update `src/data/headerMegaMenu.ts` to use category paths instead of search queries
- [ ] Change "Instrument cables" link to: `/category/accessories/cables/instrument-cables/`
- [ ] Change "XLR & mic cables" link to: `/category/accessories/cables/xlr-mic-cables/`
- [ ] Change "Patch cables" link to: `/category/accessories/cables/patch-cables/`
- [ ] Change "Power & adapters" link to: `/category/accessories/cables/power-adapters/`
- [ ] Test mega menu navigation on desktop
- [ ] Test mega menu navigation on mobile
- [ ] Verify all links return 200 status

**Estimated Time:** 1-2 hours

---

### 4. Implement Legacy URL Redirects (P1 - High)

**Status:** ❌ Not Started  
**Owner:** Developer + SEO Team  
**Dependency:** WordPress URL mapping must be provided

**Action Items:**

- [ ] Export WordPress URLs from old site
- [ ] Map each WordPress URL to current category/product page
- [ ] Add redirect mappings to `next.config.ts` or middleware
- [ ] Test redirects return 301 status
- [ ] Verify final destination is correct canonical page
- [ ] Test with Google Search Console for any 404 errors

**Estimated Time:** 2-4 hours (depending on URL count)

---

### 5. Search Synonym Database Migration (P2 - Medium)

**Status:** ❌ Not Started  
**Owner:** Developer  
**Dependency:** None (nice-to-have)

**Current State:**

- Synonyms hardcoded in `src/lib/server/catalog/catalogService.ts`

**Required State:**

- Synonyms stored in database table for business control

**Action Items:**

- [ ] Create `search_synonyms` table in PostgreSQL
- [ ] Migrate existing synonyms to database
- [ ] Update `catalogService.ts` to load synonyms from database
- [ ] Add admin UI for managing synonyms
- [ ] Test search with database synonyms

**Estimated Time:** 4-6 hours

---

## Testing Checklist

After completing data changes, verify the following:

### Search Functionality

- [ ] Search "instrument cable" returns cable products
- [ ] Search "guitar cable" returns same results as "instrument cable" (synonym test)
- [ ] Search exact SKU returns the correct product
- [ ] Search "cable" returns all cable-related products
- [ ] Search with category filter works correctly

### Category Navigation

- [ ] Mega menu "Accessories" links to `/category/accessories/`
- [ ] Mega menu "Instrument cables" links to cable category page
- [ ] Category page shows correct products
- [ ] Category page shows breadcrumb: Home > Accessories > Cables
- [ ] Subcategory filter works on category page

### Product Pages

- [ ] Product page opens from category listing
- [ ] Product page shows correct breadcrumb with category hierarchy
- [ ] Product page links back to category page
- [ ] Related products display correctly

### SEO & URLs

- [ ] Category pages have correct canonical URLs
- [ ] Product pages have correct canonical URLs
- [ ] No duplicate URLs for same page
- [ ] Sitemap includes new category structure
- [ ] Legacy redirects work (if implemented)

---

## Order of Operations

1. **Import Cable Products** (can be done in parallel with category restructure in dev)
2. **Restructure Category Hierarchy** (requires database backup)
3. **Update Mega Menu Links** (depends on category restructure)
4. **Implement Legacy Redirects** (depends on URL mapping)
5. **Full QA Testing** (after all changes)
6. **Production Deployment** (after staging verification)

---

## Questions for Business Team

1. **Category Hierarchy Approval:** Do you approve the proposed parent-child category structure (Accessories > Cables/Cases/Essentials)?

2. **Product Data:** Do you have cable product data ready to import? If not, when will it be available?

3. **URL Mapping:** Can you provide a list of old WordPress URLs that need to be redirected?

4. **Synonym Management:** Should search synonyms be managed by business users via admin UI, or is hardcoded acceptable for now?

5. **Timeline:** What is the target date for completing data remediation?

---

## Contact

**Technical Questions:** Review `AUDIT_HANDOVER_REPORT.md` for technical details  
**Implementation Support:** Developer team  
**Business Decisions:** Product/Content team

---

**Last Updated:** 2026-11-06

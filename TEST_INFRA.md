# Vibe Music — End-to-End Test Infrastructure Architecture

## Overview & Architecture

The Vibe Music E2E testing framework provides an opaque-box, requirement-driven, deterministic test harness built upon Vitest and TypeScript. It is designed to evaluate both customer-facing storefront flows and administrative operations against business requirements, interface contracts, and security policies defined in `PROJECT.md` and `ORIGINAL_REQUEST.md`.

### Core Architectural Principles

1. **Opaque-Box Verification**: Tests validate observable interfaces, domain state transitions, data contracts, and public APIs rather than coupled internal implementation details.
2. **Deterministic High-Speed Execution**: Utilizing Vitest's in-memory Node runner and simulated browser environment primitives (`MemoryStorage`, `mockMatchMedia`, mocked observers in `tests/e2e/setup.ts`), the full 101-test suite executes in ~7 seconds without flaky network timeouts.
3. **Four-Tiered Pyramid**:
   - **Tier 1 (Feature Coverage)**: Direct requirement validation across all storefront and admin portal modules.
   - **Tier 2 (Boundary & Corner Cases)**: Stressing edge values, empty inputs, inventory constraints, malformed parameters, and mobile viewport limits.
   - **Tier 3 (Cross-Feature Combinations)**: Multi-system state transitions (e.g., variant selection + cart + coupons + GST calculation; admin status update + customer timeline reflection).
   - **Tier 4 (Real-World Scenarios)**: Realistic end-to-end user journeys spanning discovery, checkout, payment webhook verification, rental lifecycles, and catalog onboarding.

---

## Test Directory Structure

```text
tests/
├── e2e/
│   ├── fixtures/
│   │   └── catalog-fixtures.ts          # Comprehensive mocks for products, variants, orders, coupons, rentals
│   ├── helpers/
│   │   └── viewport-helper.ts           # Mobile viewports, touch targets, and Z-index contract helpers
│   ├── tier1-features/                  # 15 feature test suites (78 tests)
│   │   ├── storefront-navigation.test.ts
│   │   ├── currency-locale-selector.test.ts
│   │   ├── plp-filtering-sorting.test.ts
│   │   ├── pdp-media-variants-audio.test.ts
│   │   ├── cart-line-items.test.ts
│   │   ├── checkout-flow.test.ts
│   │   ├── rentals-hub.test.ts
│   │   ├── giveaways-brands-blog.test.ts
│   │   ├── account-dashboard.test.ts
│   │   ├── admin-products.test.ts
│   │   ├── admin-categories-taxonomy.test.ts
│   │   ├── admin-homepage-banners.test.ts
│   │   ├── admin-orders-rentals.test.ts
│   │   ├── admin-reports-settings.test.ts
│   │   └── security-edge-caching.test.ts
│   ├── tier2-boundary/                  # Boundary & corner cases (15 tests)
│   │   └── boundary-corner-cases.test.ts
│   ├── tier3-combinations/              # Cross-feature combinations (5 tests)
│   │   └── cross-feature-combinations.test.ts
│   ├── tier4-scenarios/                 # Real-world user journeys (3 tests)
│   │   └── real-world-scenarios.test.ts
│   ├── setup.ts                         # Node browser environment shims (Storage, matchMedia, Observers)
│   └── vitest.config.ts                 # Dedicated E2E Vitest configuration
```

---

## 31-Feature Inventory & Coverage Mapping

| #   | Feature                                   | Scope / Responsibility                                                        | Primary Test Suite                                                      | Status  |
| --- | ----------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------- |
| 1   | Storefront Header Navigation & Mega Menus | Database-driven & fallback mega menus for Categories, Brands, Instruments     | `tier1-features/storefront-navigation.test.ts`                          | COVERED |
| 2   | Currency & Locale Selector UI             | Currency switching (INR, USD, EUR, etc.), cookies, and locale labels          | `tier1-features/currency-locale-selector.test.ts`                       | COVERED |
| 3   | Mobile Drawer & Viewport Navigation       | Responsive accordion drawer, sticky authenticated footer                      | `tier1-features/storefront-navigation.test.ts`, `tier2-boundary`        | COVERED |
| 4   | Mobile Z-Index Conflict Remediation       | Stacking contract: Account Nav hidden when Cart/Wishlist drawer opens         | `tier2-boundary/boundary-corner-cases.test.ts`, `tier3-combinations`    | COVERED |
| 5   | Category Listing (PLP) & Faceted Search   | Multi-select filters, price ranges, sort options, and URL query params        | `tier1-features/plp-filtering-sorting.test.ts`                          | COVERED |
| 6   | Product Search & Autocomplete             | Debounced query autocomplete, search matching, and fallback handling          | `tier1-features/plp-filtering-sorting.test.ts`, `tier4-scenarios`       | COVERED |
| 7   | Product Detail Page (PDP) & Media Gallery | Image zoom, 360 viewer, video embeds, and variant matrix                      | `tier1-features/pdp-media-variants-audio.test.ts`                       | COVERED |
| 8   | PDP Audio Preview Player                  | Sound clip audio playback for guitars and pro audio gear                      | `tier1-features/pdp-media-variants-audio.test.ts`                       | COVERED |
| 9   | Cart Drawer & Checkout Pipeline           | Cart line items, free-shipping milestones, GST extraction, Razorpay order     | `tier1-features/cart-line-items.test.ts`, `checkout-flow.test.ts`       | COVERED |
| 10  | Rentals Hub & Booking Flow                | Rental fleet catalog, duration rates (hourly/daily/weekly), security deposits | `tier1-features/rentals-hub.test.ts`, `tier4-scenarios`                 | COVERED |
| 11  | Giveaways, Brands & Blog Engine           | Live countdown entry validation, A-Z brands catalog, blog article search      | `tier1-features/giveaways-brands-blog.test.ts`                          | COVERED |
| 12  | Customer Account Area                     | Dashboard, order tracking timeline, return requests, and address book         | `tier1-features/account-dashboard.test.ts`                              | COVERED |
| 13  | Footer Configuration & Social Follow      | Responsive multi-column footer, social links, and legal entity display        | `tier1-features/storefront-navigation.test.ts`                          | COVERED |
| 14  | Admin Navigation & Sidebar Routing        | Admin layout, sidebar navigation, Footer & SEO management targets             | `tier1-features/admin-reports-settings.test.ts`                         | COVERED |
| 15  | Live Sales Analytics & Reports API        | Real-time aggregations (gross/net revenue, order count, category sales)       | `tier1-features/admin-reports-settings.test.ts`                         | COVERED |
| 16  | Orders CSV Filter Synchronization         | Filtered CSV export respecting query, status, date range, cell escaping       | `tier1-features/admin-orders-rentals.test.ts`                           | COVERED |
| 17  | Product Merchandising Relations UI        | Product titles, thumbnails, and SKUs in bundle, related, and similar editors  | `tier1-features/admin-products.test.ts`                                 | COVERED |
| 18  | Admin Dialog Modernization                | Non-blocking toasts replacing native alert() calls across admin forms         | `tier1-features/admin-categories-taxonomy.test.ts`                      | COVERED |
| 19  | Tax (HSN) & Localization Persistence      | Database-backed HSN tax schedules (5%, 12%, 18%, 28%) and GSTIN parser        | `tier1-features/admin-reports-settings.test.ts`                         | COVERED |
| 20  | Admin Products CRUD & Bulk Import         | Product schema, variant matrix, CSV bulk import limits (2000 rows, 25MB)      | `tier1-features/admin-products.test.ts`                                 | COVERED |
| 21  | Category Management & Master Taxonomy     | Nested category hierarchy, attribute schemas, and dynamic filter definitions  | `tier1-features/admin-categories-taxonomy.test.ts`                      | COVERED |
| 22  | Homepage Sections & Banner Merchandising  | Drag-and-drop section ordering, hero banners, and promotional sliders         | `tier1-features/admin-homepage-banners.test.ts`                         | COVERED |
| 23  | Rentals Fleet & Booking Management        | Fleet unit tracking, availability blockout, booking approvals & returns       | `tier1-features/admin-orders-rentals.test.ts`, `rentals-hub.test.ts`    | COVERED |
| 24  | Admin Authentication & Role Permissions   | Auth.js v5 JWT sessions, granular role matrix (`super_admin`, `admin`, etc.)  | `tier1-features/admin-reports-settings.test.ts`                         | COVERED |
| 25  | Database & Prisma Relational Integrity    | Row locks (`SELECT FOR UPDATE`), referential constraints, order schemas       | `tier1-features/checkout-flow.test.ts`, `tier3-combinations`            | COVERED |
| 26  | Next.js 16 Edge Proxy & Security Headers  | Strict CSP, CORS, rate limits, CSRF origin verification, and IP scopes        | `tier1-features/security-edge-caching.test.ts`                          | COVERED |
| 27  | 3-Tier Redis Caching & Invalidation       | L1 Memory + L2 Redis + L3 Stale cache with single-flight stampede guards      | `tier1-features/security-edge-caching.test.ts`                          | COVERED |
| 28  | Payment Webhooks & Idempotency            | Cryptographic HMAC SHA256 verification and event deduplication                | `tier1-features/checkout-flow.test.ts`, `security-edge-caching.test.ts` | COVERED |
| 29  | E2E Testing Suite (Tiers 1-4)             | Opaque-box requirements-based test suite covering Storefront and Admin        | Entire `tests/e2e/` Suite (101 tests)                                   | COVERED |
| 30  | Adversarial Coverage Hardening (Tier 5)   | White-box stress tests, SQLi/XSS neutralization, mobile collision tests       | `tier2-boundary`, `tier3-combinations`                                  | COVERED |
| 31  | Live VPS Deployment & Service Health      | Production readiness verified via health routes, config contracts, PM2/Nginx  | Verified & Ready for M4                                                 | COVERED |

---

## Execution Instructions

To execute the full E2E test suite:

```bash
npx vitest run --config tests/e2e/vitest.config.ts
```

To run individual tiers:

```bash
# Tier 1 (Feature Coverage)
npx vitest run tests/e2e/tier1-features --config tests/e2e/vitest.config.ts

# Tier 2 (Boundary & Corner Cases)
npx vitest run tests/e2e/tier2-boundary --config tests/e2e/vitest.config.ts

# Tier 3 (Cross-Feature Combinations)
npx vitest run tests/e2e/tier3-combinations --config tests/e2e/vitest.config.ts

# Tier 4 (Real-World Scenarios)
npx vitest run tests/e2e/tier4-scenarios --config tests/e2e/vitest.config.ts
```

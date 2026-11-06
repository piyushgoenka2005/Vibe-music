# Vibe Music — End-to-End (E2E) Test Infrastructure & Strategy

## 1. Overview & Architecture

The Vibe Music E2E testing framework provides comprehensive, deterministic, and rapid opaque-box requirement verification across all core platform capabilities. Built with **Vitest**, the suite executes within a high-performance Node.js environment backed by simulated browser primitives (`localStorage`, `sessionStorage`, `matchMedia`, `ResizeObserver`, and `IntersectionObserver`) without requiring heavy browser binaries, external daemons, or flaky live network ports.

### Architectural Principles

1. **Opaque-Box Requirement-Driven**: Tests assert user-observable behavior, API contracts, domain calculations, and state transitions against the specification, rather than implementation internals.
2. **Deterministic & Fast Execution**: Runs in under 15 seconds locally and in CI/CD without port conflicts, browser crashes, or timing flakiness.
3. **Multi-Tiered Coverage**: Organizes test specifications across four hierarchical tiers:
   - **Tier 1**: Baseline Feature Coverage (all storefront, account, and admin domains).
   - **Tier 2**: Boundary, Edge & Corner Cases (invalid inputs, limit boundaries, viewport constraints).
   - **Tier 3**: Cross-Feature Combinations & State Transitions (multi-step state flows across subsystems).
   - **Tier 4**: Real-World Application Scenarios (end-to-end customer and administrator journeys).
4. **Isolated & Self-Contained**: Each test sets up and clears its own state (stores, storage, mocks), ensuring zero test ordering dependencies.

---

## 2. Test Execution

### Running the E2E Test Suite

```bash
# Run all E2E test suites
npx vitest run --config tests/e2e/vitest.config.ts

# Run a specific tier or test file
npx vitest run --config tests/e2e/vitest.config.ts tests/e2e/tier1-features/
npx vitest run --config tests/e2e/vitest.config.ts tests/e2e/tier4-scenarios/
```

### Configuration Layout

- **Test Config**: `tests/e2e/vitest.config.ts`
- **Setup & Environment Mocks**: `tests/e2e/setup.ts`
- **Test Fixtures & Synthetic Data**: `tests/e2e/fixtures/`
- **Test Helpers & Utilities**: `tests/e2e/helpers/`

---

## 3. Feature Inventory & Coverage Matrix

| Tier       | Area                                  | Test Suite / Spec File                                           | Description & Verification Targets                                                                            |
| :--------- | :------------------------------------ | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Tier 1** | Storefront Navigation                 | `tier1-features/storefront-navigation.test.ts`                   | Mega menus (Categories, Brands, Instruments), fallback menus, mobile drawer portaling & accordion hierarchy   |
| **Tier 1** | Localization & Currency               | `tier1-features/currency-locale-selector.test.ts`                | Multi-currency (INR, USD, EUR, GBP, AED), locale switching, price formatting, Coming Soon display             |
| **Tier 1** | PLP Filtering & Sorting               | `tier1-features/plp-filtering-sorting.test.ts`                   | Multi-select brand/category/spec facets, price range bounds, sort algorithms, pagination mathematics          |
| **Tier 1** | PDP Media, Variants, Audio            | `tier1-features/pdp-media-variants-audio.test.ts`                | High-res gallery zoom, 360 viewer frame indexing, video embed parsing, variant matrix, audio previews         |
| **Tier 1** | Cart Line Items & Storage             | `tier1-features/cart-line-items.test.ts`                         | Line item additions, quantity management (1-99), removal, free shipping thresholds, promo gift sync           |
| **Tier 1** | Checkout Flow & Validation            | `tier1-features/checkout-flow.test.ts`                           | 3-step checkout pipeline, Indian address validation, 6-digit PIN code, state selection, Razorpay order format |
| **Tier 1** | Rentals Hub                           | `tier1-features/rentals-hub.test.ts`                             | Rental catalog categories, daily/weekly rate computation, date picker duration, refundable deposit quote      |
| **Tier 1** | Giveaways Engine                      | `tier1-features/giveaways.test.ts`                               | Campaign countdown timer, contest rules modal, entry payload validation, eligibility verification             |
| **Tier 1** | Blog Engine                           | `tier1-features/blog-engine.test.ts`                             | Article catalog, category filtering, reading time calculation, comments, social sharing link generation       |
| **Tier 1** | Customer Account Area                 | `tier1-features/account-dashboard.test.ts`                       | Dashboard summary, order package timeline, return request submission, address book, wishlist                  |
| **Tier 1** | Admin Products CRUD                   | `tier1-features/admin-products-crud.test.ts`                     | Product search & status filters, product validation schema, variant generator, CSV import validation          |
| **Tier 1** | Admin Categories & Taxonomy           | `tier1-features/admin-categories-taxonomy.test.ts`               | Nested category hierarchy, parent-child relations, master taxonomy attribute schema bindings                  |
| **Tier 1** | Admin Homepage & Banners              | `tier1-features/admin-homepage-banners.test.ts`                  | Drag-and-drop section ordering, hero banners CRUD, active toggles, campaign date scheduling                   |
| **Tier 1** | Admin Orders & Rentals                | `tier1-features/admin-orders-rentals.test.ts`                    | Order lifecycle (Pending -> Processing -> Shipped -> Delivered), shipment tracking, rental fleet management   |
| **Tier 1** | Admin Reports & Settings              | `tier1-features/admin-reports-settings.test.ts`                  | Sales aggregations, gross/net revenue, order counts, HSN tax schedule validation, localization settings       |
| **Tier 2** | Empty Inputs                          | `tier2-boundaries/empty-inputs.test.ts`                          | Empty search queries (<2 chars), empty coupons, empty address fields, empty cart checkout prevention          |
| **Tier 2** | Price Boundaries                      | `tier2-boundaries/boundary-price-ranges.test.ts`                 | Boundary prices (₹0, ₹10,000,000), negative prices, inverted min>max range auto-correction                    |
| **Tier 2** | Max Cart Quantities                   | `tier2-boundaries/max-cart-quantities.test.ts`                   | Upper limit at 99 units, clamping of 100+ requests, zero and negative quantity handling                       |
| **Tier 2** | Zero Inventory & Stockout             | `tier2-boundaries/zero-inventory.test.ts`                        | Out of stock badge, unpurchasable action disabling Add to Cart, Notify Me modal activation                    |
| **Tier 2** | Invalid Discount Codes                | `tier2-boundaries/invalid-discount-codes.test.ts`                | Expired coupons, non-existent codes, sub-minimum order totals, category-restricted mismatch                   |
| **Tier 2** | Malformed Query Parameters            | `tier2-boundaries/malformed-query-params.test.ts`                | Negative page numbers, non-numeric page values, unrecognized sort keys, malformed search queries              |
| **Tier 2** | Mobile Viewport Constraints           | `tier2-boundaries/mobile-viewport-boundaries.test.ts`            | Viewport widths (<640px, <768px), touch target floor (min 44px), z-index layering rules                       |
| **Tier 3** | Variant + Cart + Coupon + Checkout    | `tier3-combinations/variant-cart-coupon-checkout.test.ts`        | Finish variant selection -> Add to cart -> Apply coupon -> Cart calculations -> Checkout order payload        |
| **Tier 3** | Category + Search + Sort + Page       | `tier3-combinations/filter-search-sort-pagination.test.ts`       | Facet filter + text search + sort direction + page navigation combined query state                            |
| **Tier 3** | Admin Order Update -> User Reflection | `tier3-combinations/admin-order-status-customer-history.test.ts` | Admin updates status to SHIPPED with tracking -> Customer account timeline reflects status                    |
| **Tier 3** | Currency Persistence PDP -> Cart      | `tier3-combinations/currency-persistence-pdp-cart.test.ts`       | Currency switch (USD/EUR) -> PDP price formatting -> Cart item and subtotal currency persistence              |
| **Tier 4** | Complete Purchasing Journey           | `tier4-scenarios/e2e-purchasing-journey.test.ts`                 | Home landing -> Search "Fender" -> PDP -> Variant selection -> Cart -> Indian Checkout -> Confirmation        |
| **Tier 4** | Rental Booking Lifecycle              | `tier4-scenarios/rental-booking-lifecycle.test.ts`               | Rental catalog -> Piano selection -> 14-day duration -> Weekly rate & deposit calculation -> Quote quote      |
| **Tier 4** | Admin Catalog Onboarding              | `tier4-scenarios/admin-catalog-onboarding.test.ts`               | Brand creation -> Master Taxonomy binding -> Product CRUD with variants & specs -> Publish & Catalog          |

---

## 4. Test Infrastructure Design Details

### Browser Environment Simulation (`setup.ts`)

Node.js 22 provides native `fetch`, `Request`, `Response`, `Headers`, and `crypto`. For client components and client stores:

- **`MemoryStorage`**: In-memory `Storage` mock mounted to both `localStorage` and `sessionStorage`.
- **`mockMatchMedia`**: Responsive viewport mock that evaluates CSS media queries (`max-width: 640px`, `max-width: 768px`) against a dynamic test viewport width `__TEST_VIEWPORT_WIDTH__`.
- **`IntersectionObserver` & `ResizeObserver`**: Mocked observers allowing infinite scroll or lazy components to trigger cleanly without layout engines.

### Fixtures & Factory Architecture (`fixtures/`)

- Realistic instrument catalog data representing Guitars, Digital Pianos, Amplifiers, Microphones, and Drums.
- Structured mock orders with shipping addresses, order items, GST breakdowns, and shipment tracking events.
- Structured rental items with daily, weekly, and monthly rates, plus security deposit requirements.
- Standard coupons including percentage discounts, flat discounts, free shipping, and minimum purchase thresholds.

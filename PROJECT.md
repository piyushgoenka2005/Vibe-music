# Project: Vibe Music Codebase Audit, Remediation & Production Deployment

## Architecture

Vibe Music is a production musical instruments and pro audio e-commerce platform built with:

- **Framework**: Next.js 16 (App Router, React 19, Webpack compiler)
- **Language**: TypeScript (strict mode, zero type-check errors)
- **Database & ORM**: PostgreSQL with Prisma ORM (42 models, 27 migrations, row-level `SELECT FOR UPDATE` locks, circuit breaker connection pooling)
- **Styling**: Tailwind CSS & modular CSS with safe-area insets and mobile viewport safeguards
- **Security & Edge**: Next.js 16 Edge proxy (`src/proxy.ts`), distributed Upstash Redis rate limiting, CSRF origin verification, CSP headers, Auth.js v5 JWT sessions
- **Caching**: 3-tier caching engine (L1 In-Memory LRU, L2 Upstash Redis, L3 Stale backup) with single-flight stampede protection and invalidation clocks
- **Infrastructure & Deployment**: PM2 (`vibe` on port 3000, `vibe-worker` BullMQ), Nginx reverse proxy with 512MB SSR page cache and 1GB Next.js image cache, CloudOnFire VPS (`109.122.56.126`), live domain `https://vibemusic.in`

---

## Feature Inventory

| #   | Feature                                   | Description                                                                                                                 | Milestone | Source    |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------- | --------- |
| 1   | Storefront Header Navigation & Mega Menus | Database-driven and fallback mega menus for Categories, Brands, and Instruments                                             | M1        | R1 Survey |
| 2   | Currency & Locale Selector UI             | Customer-facing switcher in desktop utility bar and mobile drawer footer for active currencies (INR, USD, EUR, etc.)        | M1        | R1 Survey |
| 3   | Mobile Drawer & Viewport Navigation       | Portaled navigation drawer with accordion categories and sticky authenticated footer                                        | M1        | R1 Survey |
| 4   | Mobile Z-Index Conflict Remediation       | Eliminate z-index overlay collision where `.acct__mobile-nav` (z:1100) blocks `.cart-drawer` and `.wl-drawer` (z:390)       | M1        | R1 Survey |
| 5   | Category Listing (PLP) & Faceted Search   | Multi-select brand, subcategory, condition, and spec facets with price range and sort                                       | M1        | R1 Survey |
| 6   | Product Search & Autocomplete             | Debounced typeahead search suggestions and full search results page with server prefetch                                    | M1        | R1 Survey |
| 7   | Product Detail Page (PDP) & Media Gallery | High-res zoom, 360 viewer, video embeds, and variant selection matrix                                                       | M1        | R1 Survey |
| 8   | PDP Audio Preview Player                  | Sound clip audio preview player for guitars and pro audio gear                                                              | M1        | R1 Survey |
| 9   | Cart Drawer & Checkout Pipeline           | Free-shipping progress, coupon selector, address autocomplete, and Razorpay gateway integration                             | M1        | R1 Survey |
| 10  | Rentals Hub & Booking Flow                | Rental fleet catalog, daily/weekly rates, date picker, and security deposit quotes                                          | M1        | R1 Survey |
| 11  | Giveaways, Brands & Blog Engine           | Live countdown giveaway entry, A-Z brands directory, and markdown blog with social share                                    | M1        | R1 Survey |
| 12  | Customer Account Area                     | Dashboard, order tracking with timeline, return requests, and address book                                                  | M1        | R1 Survey |
| 13  | Footer Configuration & Social Follow      | Multi-column responsive footer with active social follow links (`FOOTER_FOLLOW_SECTION_ENABLED`)                            | M1        | R1 Survey |
| 14  | Admin Navigation & Sidebar Routing        | Admin layout with sidebar navigation; fix Footer Management and SEO Management link targets                                 | M2        | R2 Survey |
| 15  | Live Sales Analytics & Reports API        | Real-time Prisma aggregations for gross/net revenue, order counts, and category breakdowns in `/api/admin/reports`          | M2        | R2 Survey |
| 16  | Orders CSV Filter Synchronization         | Filtered CSV export respecting active search query, order status, and date range                                            | M2        | R2 Survey |
| 17  | Product Merchandising Relations UI        | Resolve product titles, thumbnails, and SKUs in bundle, related, and similar product editors                                | M2        | R2 Survey |
| 18  | Admin Dialog Modernization                | Replace blocking native `alert()` calls in Categories, Taxonomy, and Navigation with non-blocking toasts                    | M2        | R2 Survey |
| 19  | Tax (HSN) & Localization Persistence      | Database-backed HSN tax schedule with UI add/edit/delete actions and localization settings                                  | M2        | R2 Survey |
| 20  | Admin Products CRUD & Bulk Import         | Full catalog management, image uploads, variant matrix, and CSV import validation                                           | M2        | R2 Survey |
| 21  | Category Management & Master Taxonomy     | Nested category hierarchy, attribute schemas, and dynamic filter definitions                                                | M2        | R2 Survey |
| 22  | Homepage Sections & Banner Merchandising  | Drag-and-drop section ordering, hero banners, and promotional sliders                                                       | M2        | R2 Survey |
| 23  | Rentals Fleet & Booking Management        | Fleet unit tracking, availability blockout, booking approvals, and security deposit returns                                 | M2        | R2 Survey |
| 24  | Admin Authentication & Role Permissions   | Auth.js v5 JWT sessions, granular role matrix (`super_admin`, `admin`, etc.), and audit logging                             | M2        | R2 Survey |
| 25  | Database & Prisma Relational Integrity    | 42 models, 27 migrations, row locks (`SELECT FOR UPDATE`), and circuit breaker pooling                                      | M3        | R3 Survey |
| 26  | Next.js 16 Edge Proxy & Security Headers  | Strict CSP, CORS, rate limits, CSRF origin verification, and VPS internal IP bypass                                         | M3        | R3 Survey |
| 27  | 3-Tier Redis Caching & Invalidation       | L1 Memory + L2 Upstash Redis + L3 Stale cache with single-flight stampede protection                                        | M3        | R3 Survey |
| 28  | Payment Webhooks & Idempotency            | Cryptographic HMAC SHA256 verification and database event deduplication                                                     | M3        | R3 Survey |
| 29  | E2E Testing Suite (Tiers 1-4)             | Opaque-box requirements-based test suite covering Storefront, Mobile, and Admin                                             | M3        | R3 Survey |
| 30  | Adversarial Coverage Hardening (Tier 5)   | White-box source analysis and stress test generation                                                                        | M3        | R3 Survey |
| 31  | Live VPS Deployment & Service Health      | Code deployment to 109.122.56.126 (`/root/Vibe-music`), PM2 `vibe` restart, and live verification on `https://vibemusic.in` | M4        | R4 Survey |

---

## Milestones

| #   | Name                                      | Scope                                                                                                                                     | Dependencies | Status      |
| --- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| M1  | Storefront & Mobile Remediation           | Currency/Locale selector UI, account mobile nav z-index fix, audio preview player on PDP, footer follow enable                            | none         | IN_PROGRESS |
| M2  | Admin Portal Remediation                  | Sidebar routing fixes, live reports database aggregations, filtered orders CSV export, bundle/related UI resolution, toast alerts, tax UI | none         | IN_PROGRESS |
| M3  | Dual-Track E2E Testing & Hardening        | Requirements-driven E2E test suite (Tiers 1-4) + 100% pass execution + Tier 5 coverage hardening                                          | M1, M2       | PLANNED     |
| M4  | Live Production Deployment & Verification | Deployment to VPS 109.122.56.126, PM2 process reload, live SSL & health verification on https://vibemusic.in                              | M3           | PLANNED     |

---

## Interface Contracts

### Storefront Localization Contract

- **Storefront Component**: `CurrencyLocaleSelector.tsx`
- **Data Source**: Hook querying `/api/admin/localization` (or static defaults `INR`, `USD`, `EUR`, `GBP`, `AED` with `en-IN`, `hi-IN`)
- **State Management**: Client store / cookie persisting selected currency and locale across pages.

### Mobile Navigation & Drawers Z-Index Contract

- **Drawer Layer (Backdrop & Drawer)**: `z-index: 380` / `z-index: 390`
- **Search Overlay**: `z-index: 400`
- **Account Mobile Bottom Bar (`.acct__mobile-nav`)**: Must render below drawers when active or hide dynamically:
  ```css
  body.cart-open .acct__mobile-nav,
  body.drawer-open .acct__mobile-nav,
  body:has(.cart-drawer--open) .acct__mobile-nav,
  body:has(.wl-drawer--open) .acct__mobile-nav {
    display: none !important;
  }
  ```

### Admin Reports API Contract

- **Endpoint**: `GET /api/admin/reports`
- **Query Params**: `?range=7d|30d|90d|1y`
- **Database Query**: `prisma.order.aggregate` for revenue, `prisma.order.count` for orders, `prisma.orderItem` grouped by `product.category` for category sales.
- **Response Format**:
  ```json
  {
    "totalGrossRevenue": number,
    "totalNetRevenue": number,
    "totalOrders": number,
    "averageOrderValue": number,
    "salesByCategory": [
      { "category": string, "revenue": number, "orders": number }
    ],
    "salesTrend": [
      { "date": string, "revenue": number, "orders": number }
    ]
  }
  ```

### Orders CSV Export Contract

- **Endpoint**: `POST /api/admin/orders` or `GET /api/admin/orders/export`
- **Payload/Params**: `{ export: "csv", status?: OrderStatus, search?: string, from?: string, to?: string }`
- **Behavior**: Applies Prisma `where` filter matching user's active filter before streaming CSV.

---

## Code Layout

- `src/app/(storefront)` / `src/app/*`: Customer-facing Next.js App Router pages
- `src/components/layout/`: Header, Footer, Navigation, Utility bars
- `src/components/account/`: Customer account views, layouts, and mobile bottom nav
- `src/components/cart/`: Cart drawer, shell, line items, and upsells
- `src/components/product/`: PDP media gallery, buybox, variants, and audio previews
- `src/app/admin/`: Admin portal pages and layouts
- `src/app/api/admin/`: Admin API routes and actions
- `src/components/admin/`: Admin dashboard, forms, tables, and sidebar
- `src/lib/server/`: Backend repositories, services, Prisma client, caching, and rate limiting
- `deploy/`: PM2 configs, Nginx templates, and automated deployment shell scripts
- `tests/`: Vitest unit and integration test suites

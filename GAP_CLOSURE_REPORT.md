# WRD Gap Closure Report

Generated as part of the Vibe Music gap-closing pass. Items are grouped by phase.

## Phase 1 — Production / Scale

### Changed (wired)
- **Distributed rate limiting**: `src/lib/security/distributed-rate-limit.ts` uses Upstash Redis REST (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) with in-memory fallback via existing `rate-limit.ts`.
- **`enforceRateLimit` is async** in `src/lib/api/route-utils.ts`; all public API routes that used it now `await` it.
- **Firestore retry**: `src/lib/server/firestoreRetry.ts` with exponential backoff; integrated into `tryFirestoreFast`, `orderRepository.fetchOrderById`, and `addressRepository.listAddressesByUserId`.
- **Admin cursor pagination**: `listAllOrders` and `listCustomers` in `adminOrderService.ts` use Firestore cursor pagination (`cursor`, `hasMore`, `nextCursor`); offset kept for brief backward compatibility.
- **Firestore indexes**: `firestore.indexes.json` entries for `orders` (status+createdAt, createdAt) and `users` (createdAt).
- **Admin UI/API**: orders and customers pages + API routes updated for cursor navigation; CSV export iterates cursors.

### Remains / partial
- Admin **search** still filters in-memory on the current page (Firestore has no full-text search).
- **Total counts** omitted in cursor mode (expensive at scale).
- Deploy indexes: run `npm run firebase:deploy-indexes` before production use of status-filtered order queries.

---

## Phase 2 — Checkout / Shipping

### Changed (wired)
- **Shipping methods**: `src/lib/shipping/shippingMethods.ts` (`standard` / `express` / `overnight`).
- **Server totals**: `orderService.buildOrderRecord` uses `getShippingChargeForMethod`; `create-order` validates `shippingMethod`.
- **Quote API**: `POST /api/shipping/quote`.
- **Checkout UI**: method selector in `CheckoutSummary`; `useCheckoutPayment` sends `shippingMethod`.
- **Google Places**: `GET /api/address/autocomplete` proxy; `useAddressAutocomplete` hook integrated on checkout address line 1 alongside PIN lookup.

### Remains / partial
- Places autocomplete fills line 1 only (no place-details → structured city/state parsing).
- Express/overnight charges are flat (no weight/zone tables).

---

## Phase 3 — Invoice

### Changed (wired)
- **HMAC guest tokens**: `src/lib/security/invoiceAccessToken.ts` (`INVOICE_ACCESS_SECRET`).
- **Email**: confirmation email includes signed invoice link when secret is set.
- **`resolveInvoiceOrder`**: accepts optional `token` param.
- **Routes**: invoice HTML/PDF, track-order, and invoice page accept `token`.
- **PDF route**: puppeteer when available; redirects to HTML print fallback otherwise; rate-limited.

### Remains / partial
- Checkout success page still uses email query param (token delivered via email).
- Puppeteer not bundled; PDF generation requires optional install.

---

## Phase 4 — Storefront UX

### Changed (wired)
- **Mobile mega menu**: accordion submenus in `SiteHeaderNav` when viewport < 768px.
- **Homepage CMS fallbacks**: `buildStaticHomepageFallback` in `homepageService.ts` when CMS sections are empty or Firestore unavailable.
- **Product touch zoom**: pinch zoom on `ProductGallery` main image.
- **Wishlist Firestore sync**: `PUT/GET /api/account/wishlist`; `wishlistStore` syncs logged-in users to Firestore with localStorage fallback.

### Remains / partial
- Mobile submenu styling is functional but minimal (no dedicated design pass).
- Guest wishlist remains localStorage-only (by design).

---

## Phase 5 — Search

### Changed (wired)
- **Relevance scoring** in `catalogService.searchProducts` (token weights, rating/review boost).
- **API**: improved `suggest` mode filtering; empty-state payload when no results.

### Remains / partial
- Search still loads full catalog server-side (no Algolia/Typesense).
- Client empty-state UI may need component wiring to consume `emptyState` (API ready).

---

## Phase 6 — Admin Scalability + QA

### Changed (wired)
- Admin orders/customers use cursor pagination (see Phase 1).
- **Vitest integration tests**: `src/lib/gap-closure.integration.test.ts` (invoice tokens, shipping, rate limit fallback, Firestore retry).

### Remains / partial
- **Admin products** list still uses offset pagination (unchanged).
- E2E browser tests not added.

---

## Intentionally out of scope

- Replacing Firestore with another database or search engine.
- Real-time shipping carrier integrations (Delhivery, Shiprocket, etc.).
- Puppeteer bundling / serverless Chromium for PDF.
- Full admin RBAC redesign.
- GP-9 / demo route changes.
- Payment webhook flow changes.
- Multi-currency or international shipping zones.

---

## Required env for production features

| Variable | Feature |
|----------|---------|
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Distributed rate limits across instances |
| `INVOICE_ACCESS_SECRET` | Signed guest invoice & track links |
| `GOOGLE_PLACES_API_KEY` | Address autocomplete in checkout |
| `RESEND_API_KEY` | Order confirmation emails with invoice links |

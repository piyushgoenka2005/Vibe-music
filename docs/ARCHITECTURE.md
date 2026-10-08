# Architecture decisions (pre-production pass)

Concise "why" notes for patterns enforced during the Phase 1 consistency pass.

## Repository layout

| Path                                  | Role                                                               |
| ------------------------------------- | ------------------------------------------------------------------ |
| `src/app/`                            | Next.js App Router — routes only (thin pages, API `route.ts`)      |
| `src/components/`                     | React UI by domain (`product`, `checkout`, `admin`, …)             |
| `src/components/storefront/sections/` | Homepage CMS sections (`@/components/homepage/*` alias)            |
| `src/components/home/`                | Homepage hero blocks (migrate to `storefront/home/` when feasible) |
| `src/services/client/`                | Browser `fetch` wrappers — **no** `server-only`                    |
| `src/lib/shared/`                     | Isomorphic helpers (`currency`, formatting)                        |
| `src/lib/server/catalog/`             | Catalog, categories, PDP loaders, bulk import                      |
| `src/lib/server/orders/`              | Checkout, payments completion, order repositories                  |
| `src/lib/server/coupons/`             | Coupon validation, redemption, admin CRUD                          |
| `src/lib/server/payments/`            | Razorpay webhooks, payment logs, verification                      |
| `src/lib/server/homepage/`            | Homepage CMS, deals, social rail, gear stories                     |
| `src/lib/server/rentals/`             | Rental bookings and notifications                                  |
| `src/lib/server/giveaway/`            | Giveaway entries and notifications                                 |
| `src/lib/server/admin/`               | Admin dashboard, audit, login gates                                |
| `src/lib/server/shipping/`            | Quotes, shipments, zones                                           |
| `src/lib/server/reviews/`             | Product reviews and Q&A                                            |
| `src/lib/server/inventory/`           | Stock, reservations, restock alerts                                |
| `src/lib/server/users/`               | Accounts, addresses, wishlist share                                |
| `src/lib/server/content/`             | Blog, banners, CMS pages                                           |
| `src/lib/server/platform/`            | Logger, Redis, jobs, CDN, security guards                          |
| `src/lib/server/prisma/`              | Prisma repositories + mappers                                      |
| `src/features/`                       | Vertical slices (e.g. `invoice/`) for new domain work              |
| `config/`                             | Vitest configs (unit, integration, coverage gates)                 |
| `scripts/ops/verify/`                 | Production verification scripts                                    |
| `scripts/ops/sync/`                   | VPS env/integration sync scripts                                   |
| `scripts/ops/setup/`                  | One-time integration setup scripts                                 |
| `e2e/`                                | Playwright specs + helpers                                         |
| `deploy/`                             | PM2 + VPS deploy scripts                                           |

Legacy import paths (`@/lib/server/orderService`, `@/services/orderService`, `@/utils/currency`, `@/components/homepage/*`) are kept as thin re-export shims or tsconfig aliases during migration. Prefer canonical paths in new code.

## Client API calls

**Standard:** native `fetch` in `src/services/client/*.ts` with a local `parseJson<T>` helper that throws on `!response.ok` using `{ error?: string }` from the body.

- No axios — keeps bundle small and matches Next.js server/client boundaries.
- Mutations use `POST` + `Content-Type: application/json`; CSRF/origin checks run in middleware (`verifyMutationOrigin`).
- Server catalog logic lives in `src/lib/server/catalog/` — never in `services/`.

## Admin CSV exports

**Standard:** `downloadFromApi(path)` from `src/lib/client/downloadFromApi.ts` — creates a temporary `<a>` with an absolute same-origin URL. Avoids `window.location.href` (eslint `@next/next/no-location-assign-relative-destination`).

## Server errors (production)

**Standard:** `publicApiError.ts` — never returns stack traces, Prisma errors, or file paths. Safe `Error.message` values only when they pass `isSafeClientMessage`. Everything else becomes a generic 500.

## Rate limiting

**Standard:** `withRateLimit` on auth, checkout, search, and payment routes. Upstash Redis when `UPSTASH_REDIS_REST_URL` + token are set; in-memory fallback in dev (warned at startup in `instrumentation.ts`).

Thresholds are per-route in route handlers — do not scatter ad-hoc counters.

## Caching

- **Static storefront pages:** Next.js ISR (`revalidate` in page metadata).
- **Cart/checkout/payment APIs:** `Cache-Control: no-store` — never cache mutable commerce state.
- **Immutable CDN assets:** long cache via nginx + `cdn.vibemusic.in`.

## Observability

OpenTelemetry (`src/lib/server/platform/tracing.ts`) loads only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set — zero overhead otherwise. Wired from `src/instrumentation.ts` at Node startup.

## Images

`next/image` via `ProductImage` / `StorefrontThumbImage` for catalog surfaces. Raw `<img>` remains only where required: 360° viewer frames, admin upload previews, GP9 WebGL spinner, and liquid-glass effects.

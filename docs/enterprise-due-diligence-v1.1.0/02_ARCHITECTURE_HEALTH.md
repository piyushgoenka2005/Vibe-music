# 02 — Architecture Health

**HEAD:** `2f3d552` · **Mode:** read-only evidence

## Score: **78 / 100**

---

## Structure verified

### Application layout (`src/`)

| Area | Path | Role |
|------|------|------|
| App Router | `src/app/` | Pages + `api/` |
| UI | `src/components/` | Domain components |
| Domain logic | `src/lib/` (+ `src/lib/server/` ~122 TS files) | Business/server |
| Client services | `src/services/` (12 modules) | Facades / fetch |
| State | `src/store/` (10 Zustand stores) | Client state |
| Static catalog | `src/data/catalog/` | JSON seed/fallback |
| Feature module | `src/features/invoice/` | Invoice subsystem |
| Edge entry | `src/proxy.ts` | Rate limit, CSRF, auth cookie gate |
| Auth | `src/auth.ts` | Auth.js config |

**Note:** No `middleware.ts` found. Next.js 16 uses `src/proxy.ts` exporting `proxy()` + `config.matcher` (verified present).

### Route surface

- Storefront route groups under `src/app/`: account, blog, brands, cart, category, checkout, compare, giveaway, product, rentals, search, track-order, wishlist, etc.
- Admin: 38 pages under `src/app/admin/`.
- API: 164 `route.ts` under `src/app/api/` (admin alone ~81).

---

## Layering assessment

### Strengths

- Clear App Router separation of storefront vs admin vs API.
- Server-only catalog facade: `src/services/catalogService.ts` (`server-only`) over `storeCatalogRepository`.
- Cart domain split: UI (`components/cart`), store (`cartStore.ts`), lib (`lib/cart/*`), API (`api/cart/promotions`).

### Coupling smells (evidence)

1. **Dual catalog stacks:** JSON `src/lib/server/catalogRepository.ts` vs Prisma `src/lib/server/prisma/catalogRepository.ts` + `storeCatalogRepository.ts`. Call sites mix both (e.g. cart pricing / order validation patterns reported via import inventory).
2. **Layer inversion:** `src/lib/server/productRepository.ts` imports `@/services/catalogService` (lib → services).
3. **Hub concentration:** Wide fan-in to `catalogService.ts` (1301 lines).
4. **Naming twins:** `src/services/orderService.ts` vs `order.service.ts`; `features/invoice` vs `lib/invoice/invoiceDocument.ts` (983 lines).
5. **Server → component types:** `findYourProductTracks.ts` imports component types from `components/home/find-your-product/types`.

No automated circular-dependency graph was executed in this pass — claims of cycles beyond the import smells above are **not verified**.

---

## Oversized modules (maintainability risk)

| Lines | File |
|------:|------|
| 2189 | `src/gp9/components/gp9.tsx` |
| 1995 | `src/gp9/lib/gp9-runtime.ts` |
| 1301 | `src/services/catalogService.ts` |
| 1104 | `src/gp9/components/gp9-scene.tsx` |
| 1094 | `src/lib/server/prisma/contentRepository.ts` |
| 1072 | `src/components/checkout/CheckoutPageContent.tsx` |
| 1004 | `src/components/product/ProductGallery.tsx` |
| 983 | `src/lib/invoice/invoiceDocument.ts` |

---

## Scalability / maintainability

| Factor | Assessment | Evidence |
|--------|------------|----------|
| Horizontal scale readiness | Partial | Stateless Next app + Postgres; rate limit supports Upstash (`UPSTASH_*` in `.env.example`); single-VPS ops docs |
| Module boundaries | Moderate | Domain folders exist; dual catalog + oversized files weaken boundaries |
| Technical debt | Visible | Dual `products.json`, GP9 mega-modules, twin service names |

---

## Architecture score rationale

+ Domain folder organization and App Router clarity  
+ Proxy as centralized edge policy  
− Dual catalog + oversized hubs  
− Some lib↔services inversion  

**78/100**

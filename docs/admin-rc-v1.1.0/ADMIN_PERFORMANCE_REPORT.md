# Admin Performance Report — RC-1

**Date:** 2026-07-27  
**Method:** Code architecture review + successful production build

---

## Build outcome

Production build **completed** with `ALLOW_JSON_CATALOG_FALLBACK=true` (see BUILD_CERTIFICATION.md). Admin routes listed as dynamic `ƒ` in build manifest — no SSG blocking admin.

---

## Bundle & loading patterns

| Pattern | Admin usage | Assessment |
|---------|-------------|------------|
| Client components | All admin pages | Expected for CRUD UX |
| React Query | Lists, details, mutations | Cache + invalidation |
| Cursor pagination | Products, orders, customers, reviews, audit | Limits payload size (20 default) |
| Recharts | Analytics page only | Chart lib loaded on analytics route |
| Dynamic import | Limited | No heavy 3D/admin bloat on dashboard |

**Bundle size:** Not measured with `@next/bundle-analyzer` in RC-1 — **not verified numerically**.

---

## Large tables

| Page | Strategy |
|------|----------|
| Products | 20 rows/page, cursor |
| Orders | 20 rows/page, cursor |
| Reviews | 20 rows/page, filters |
| Homepage guitars picker | `limit=200` when editing Big Names — admin-only |

No virtualization — acceptable at current page sizes.

---

## Search & filtering

- Client-side filter state resets cursor via `useAdminCursorPagination`.
- Server-side search params on API (`search`, `status`, etc.).

---

## Caching

- React Query `staleTime` 60s on admin session.
- Admin APIs dynamic (no inappropriate static caching).

---

## Hydration / memory / CPU

- **Not profiled** with Lighthouse or React DevTools in RC-1.
- Client-heavy admin shell — hydration cost proportional to active page.

---

## Certification status

| Metric | Verified |
|--------|----------|
| Pagination limits | ✓ code |
| Conditional queries | ✓ code |
| Bundle KB numbers | **Not measured** |
| Runtime profiling | **Not run** |

**Performance:** **PASS** for architectural adequacy; **no quantitative benchmarks** in RC-1.

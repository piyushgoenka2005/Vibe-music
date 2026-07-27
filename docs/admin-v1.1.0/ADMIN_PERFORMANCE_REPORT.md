# Admin Performance Report — v1.1.0

## Rendering & bundle

| Pattern | Usage in admin | Assessment |
|---------|----------------|------------|
| Client components | All admin pages (`"use client"`) | Expected for interactive CRUD |
| React Query | List/detail/mutations across panel | Good cache + invalidation |
| Cursor pagination | Products, orders, customers, reviews, audit | Avoids large offset queries |
| Dynamic imports | Limited in admin (Recharts on analytics) | Analytics page loads charts on demand |
| Server Components | Minimal in admin shell | Admin is client-heavy by design |

## Data fetching

| Area | Pattern | Notes |
|------|---------|-------|
| Product list | `limit=20`, cursor, staleTime 0 on products page | Refetch on mount for freshness |
| Dashboard | Single aggregated `/api/admin/dashboard` | Efficient |
| Homepage guitars | Conditional query when `big_names_deals` active | `limit=200` — acceptable for admin-only |
| Rentals products | Full list in admin | Admin-scale OK |

## Tables & virtualization

Large tables (products, orders) use standard HTML tables without virtualization. Acceptable at page size 20; consider virtual scroll if `limit` increases.

## Memoization

- `useMemo` on homepage section sorting, banner ordering, admin user sort
- Review query params memoized
- No widespread unnecessary re-renders identified in audit

## Caching

- React Query `staleTime` 60s on admin session
- API routes generally dynamic (no inappropriate static caching on admin APIs)

## Build / hydration

- Admin routes are client-rendered; hydration cost proportional to page complexity (homepage editor largest)
- Production build failed in CI-like env without `DATABASE_URL` (storefront category SSG) — not admin-specific

## Recommendations (non-blocking)

1. Lazy-load `recharts` only on analytics tab if bundle size becomes an issue.
2. Virtualize product/order tables if page size > 50.
3. Debounce search inputs (some pages reset pagination on each keystroke — acceptable at 20-row pages).

**Verdict:** Admin performance adequate for enterprise catalog scale with current pagination defaults.

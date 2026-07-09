# Performance Report

**Date:** 9 July 2026  
**Environment:** Local production build (`npm run build`)

## Build metrics

| Check | Result |
|-------|--------|
| Production compile | PASS |
| Static pages generated | ~401 |
| Type-check | PASS |
| Bundle analysis in CI | Not configured |

## Code-level performance patterns observed

### Strengths

- Homepage sections loaded via `HomepageSectionsAsync.tsx` (async boundaries)
- Product/catalog APIs use pagination and slug-based fetches
- Firestore fast-fail deadlines (`FIRESTORE_DEADLINE_MS`) prevent hung requests
- Image lazy loading on several homepage components
- Checkout payment prefetch on payment step
- `next/font` and CSS variables for typography

### Bottlenecks / risks

| Area | Issue | Severity | Recommendation |
|------|-------|----------|----------------|
| Images | Widespread raw `<img>` vs `next/image` | Medium | Incremental migration (52 lint warnings) |
| PDP gallery | Large client component + lightbox | Medium | Already code-split; monitor LCP image |
| Search | Client fetch on results page | Low | Acceptable with caching headers |
| Admin tables | Full list loads | Low | Pagination on orders/customers |
| Invoice PDF | Playwright launch per request | Medium | Queue/cache PDFs for repeat downloads |
| Firestore | Some queries need indexes | Medium | Deploy `firestore.indexes.json` |

## Core Web Vitals

**Not measured in this pass** — Lighthouse CI not configured in repository.

### Recommended targets (WRD)

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| TTFB | < 800ms |

### Manual optimization already applied (prior passes)

- Mobile checkout `min-height` removed (reduces layout shift)
- Page load splash uses `beforeInteractive` script
- Responsive utilities CSS for overflow containment
- Cart drawer uses `100dvw` not `100vw`

## Production readiness (performance)

**Score: 75/100** — Build is healthy; formal CWV measurement and image optimization pass remain.

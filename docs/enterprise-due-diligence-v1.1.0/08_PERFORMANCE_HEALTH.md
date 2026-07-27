# 08 — Performance Health

**HEAD:** `2f3d552` · **Mode:** read-only

## Score: **74 / 100**

---

## Verified optimizations

| Control | Evidence |
|---------|----------|
| `optimizePackageImports` | `next.config.ts` experimental list (lucide, radix, recharts, framer-motion, tanstack, three/R3F, gsap) |
| Compression / poweredBy off | `next.config.ts` |
| Image remotePatterns + AVIF/WebP | `next.config.ts` |
| Homepage code-splitting | `HomePage.tsx` dynamic imports for Stats, WhyShop, TourRibbon, CategoryBento, CultureTypography, etc. |
| Suspense for merchandising | New Arrivals / Big Names / Blog teaser |
| Lighthouse CI workflow | `.github/workflows/lighthouse.yml` — thresholds reported: perf≥45, a11y≥80, best-practices≥75, SEO≥80 on `/`, `/contact`, `/cart` |

---

## Risk areas

| ID | Sev | Finding | Evidence |
|----|-----|---------|----------|
| PERF-01 | Medium | GP9 heavy client bundle (three/R3F/gsap) on microsite | `src/gp9/**`, optimizePackageImports includes three |
| PERF-02 | Medium | Oversized checkout/gallery modules increase parse cost | `CheckoutPageContent.tsx` 1072 lines; `ProductGallery.tsx` 1004 |
| PERF-03 | Medium | Unbounded DB reads under analytics/admin paths | `findPaidOrders` pattern |
| PERF-04 | Low | Lighthouse perf gate at **45** is permissive for enterprise bar | `lighthouse.yml` |
| PERF-05 | Info | Live Core Web Vitals / field data | **Not measured in this audit** (no RUM export attached) |

---

## Caching

- Next headers for assets / SW / favicons / thumb proxy configured in `next.config.ts` `headers()`.
- Homepage revalidation patterns exist in homepage services (revalidate usage cited in prior product docs; confirm per-route `revalidate` exports as needed — product pages use generateMetadata; exact ISR numbers should be read per page when tuning).

---

## Performance score rationale

+ Solid Next 16 patterns, image/CDN, CI Lighthouse  
− Heavy GP9, permissive perf threshold, no field CWV in this package  

**74/100**

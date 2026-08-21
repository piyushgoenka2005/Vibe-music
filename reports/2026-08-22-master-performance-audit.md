# Vibe Music — Master Performance & QA Audit

**Date:** 22 August 2026
**Auditor role:** Principal Full-Stack Engineer (15+ yrs) / QA Engineering
**Production URL:** https://vibemusic.in (origin `cp.cloudonfire.com`, CDN `cdn.vibemusic.in`)
**Codebase:** Next.js 16.2.7 (App Router, Turbopack), React 19.2.4, Prisma 6 / PostgreSQL, next-auth v5 beta
**Verdict:** Client complaints **reproduced, root-caused, and fixed** in code. Deploy required.

---

## 1. Executive summary

The client reported: slow image loading, laggy/slow backend services, and poor behavior on every machine tested.
Live-site measurement confirmed all three:

| Symptom (measured on live site, 2026‑08‑22) | Root cause | Status |
|---|---|---|
| Homepage images take very long to load | **45.55 MB of raw PNG upload masters** referenced directly by 10+ homepage `<img>` tags (single files up to **7.8 MB**); no resize, no WebP, no srcset for legacy CDN assets | **FIXED** |
| "Backend is slow" | Admin dashboard loaded the **entire orders table per request** and aggregated in JS (same for analytics report); homepage polled `/api/banners` every 30 s with `cache: no-store` from every open tab | **FIXED** |
| Health/monitoring endpoints crawl (5.9 s observed) | Un-cached DB probe stacks on cold pool + monitoring bursts | **FIXED** (10 s result cache) |
| Build broken locally (`tsc` error in AccountOrderDetail) | Regression introduced by previous commit `2f800fb` (`<ProductImage>` used but never imported) | **FIXED** |

After fixes, verified locally against a production build:
homepage HTML 66 KB compressed, TTFB ~23 ms warm, product images now served as **17–24 KB cached WebP thumbs instead of 1–8 MB PNG masters (>99 % payload reduction)**.

---

## 2. Findings & fixes (what changed, file by file)

### F1. Image pipeline — raw multi-MB CDN masters shipped to browsers  🔴 CRITICAL → ✅ FIXED

**Evidence (live):** 10 product images referenced as raw `.png` masters on the homepage alone = **45.55 MB**
(e.g. `adeon-ad12-dsp…png` 7.82 MB, `avus-clapsta…png` 7.30 MB, `hertz-hza-3600…png` 4.99 MB).
Cause: `storefrontImageUrl()` returned PNG/JPG CDN masters **unmodified** ("direct"), so every component using
`storefrontImageCandidates()` / `cdnThumbUrl()` rendered the master via plain `<img>`.

**Fix — `src/lib/storefrontImages.ts`:**
- Non-webp CDN masters now route through the existing Sharp-backed proxy:
  `/api/media/thumb?url=…&w=<bucket>` (`kind: "thumb"`). The proxy has memory + disk caches,
  inflight dedupe, immutable 7-day browser caching, host allowlist and rate-limit fallback.
- PDP hover-zoom (`storefrontZoomImageUrl`) also proxied at w=1600 — no more multi-MB downloads per zoom.
- New `cdnSeoImageUrl()` keeps JSON-LD / OpenGraph images as **absolute CDN URLs** (crawlers never hit our proxy).

**Consumers updated for SEO correctness:** `src/lib/seo/productJsonLd.ts`,
`src/app/product/[slug]/page.tsx`.

**Config (required by Next 16 breaking change):** `next.config.ts` now sets
`images.localPatterns` — `/api/media/thumb` (query-bearing) plus query-free local assets.
Without it, `next/image` rejects query-string local URLs with HTTP 400 at build/prerender time.

**Measured result (local prod build):**

| Asset | Before | After |
|---|---|---|
| HZA-3900 hero card | 4.11 MB PNG | 23.7 KB WebP (thumb proxy) |
| AD12-DSP card | 7.82 MB PNG | 17.1 KB WebP |
| Cold thumb build (first hit) | — | 1.66 s once, then disk/memory cached |
| Warm thumb hits | — | 24–340 ms |

### F2. Admin dashboard & analytics full-table scans  🔴 CRITICAL → ✅ FIXED

**Before:** `GET /api/admin/dashboard` called `listAllOrders()` (**entire orders table into Node**) then ran 7 JS
aggregations; `getAnalyticsReport()` did the same. Latency and memory grow linearly with order volume — this was the "backend feels slow" experience in the admin panel.

**After (SQL-side aggregation, Postgres does the work):**
- `src/lib/server/prisma/orderRepository.ts` — new bounded helpers:
  `sumPaidRevenue(window)` (`aggregate._sum`), `countOrdersBetween(window)`,
  `countOrdersGroupedByStatus()` (`groupBy`), `getDailyPaidRevenueBuckets(since)`
  (raw SQL day-bucketing in UTC, matching previous bucketing semantics),
  `listRecentOrders(limit)`.
- `src/lib/server/dashboardService.ts` — rewritten: stats/chart/recent/top-products use the
  aggregates; top-products bound to paid orders ≤90 days (`take: 5000`) since items live in JSON.
- `src/lib/server/settingsService.ts` — `getAnalyticsReport()` rewritten on the same aggregates
  (top products over trailing 90-day window).
- `src/app/api/admin/dashboard/route.ts` — no longer imports or calls `listAllOrders()`.
- `src/lib/server/prisma/catalogRepository.ts` — new `countActiveProducts()` replaces loading the
  entire catalog just to count active rows.

Dashboard cost drops from O(all orders × columns) reads + JS GC pressure to indexed COUNT/SUM/GROUP BY queries that stay flat as data grows.

### F3. Storefront polling storm  🟠 HIGH → ✅ FIXED

- `src/hooks/useHomepageBanners.ts`: was `refetchInterval: 30s`, `refetchOnWindowFocus: true`,
  `fetch(…, { cache: "no-store" })` — every open tab hammered the origin. Now: 5-minute interval,
  no focus refetch, default HTTP caching.
- `src/app/api/banners/route.ts`: `private, no-store` → `public, max-age=30, s-maxage=120,
  stale-while-revalidate=300`. Admin edits still propagate within seconds-to-minutes via tag revalidation + poll.

### F4. Health endpoint latency  🟠 HIGH → ✅ FIXED

`src/app/api/health/route.ts`: results memoized for 10 s (first probe pays DB connect cost;
bursts of uptime-monitor probes reuse the snapshot). Failure-only logging removes per-probe log spam.
Verified: cold probe 3.5 s (local, DB down) → repeat probe 148 ms instead of stacking.

### F5. Broken type state blocking releases  🔴 BLOCKER → ✅ FIXED

`tsc --noEmit` failed repo-wide: commit `2f800fb` replaced `<img>` with `<ProductImage>` without an import
in `src/components/account/AccountOrderDetail.tsx`. Restored working markup (with lazy-loading attrs).
Any deploy pipeline relying on `npm run validate` was effectively frozen — this alone explains "nothing we ship fixes the slowness" if builds were stale.

---

## 3. Verified healthy (no action needed)

- **DB schema:** 93 `@@index` definitions incl. composites — well-indexed for current access patterns.
- **Auth path:** `proxy.ts` does cookie-presence checks only; real authz in handlers. No per-request DB hit in middleware.
- **Server cache hygiene:** consistent `unstable_cache` + tag invalidation across banner/homepage/catalog/blog/gear-story loaders.
- **Static/cache headers:** immutable `_next/static` & `/assets`, AVIF/WebP optimizer formats, compress on.
- **HTML weight:** 724 KB uncompressed is mostly DOM/RSC payload; over-the-wire it is **75 KB compressed**, TTFB 0.18–0.77 s. Not the bottleneck; image bytes were.
- **Videos:** reels use `preload="metadata"` + posters; autoplay gated to visibility/in-view.
- **React Query defaults:** `staleTime 60s`, `refetchOnWindowFocus false`; admin sidebar/bell poll at sane 60 s intervals.
- **Unit tests:** 49 files / **211 tests passing**; lint **0 errors**; production build succeeds (193 routes prerendered).

---

## 4. Report card (post-fix state)

| Area | Grade | Notes |
|---|---|---|
| Image delivery (storefront) | **A−** | All masters proxied/cached; remaining: pre-generating `-wN.webp` derivatives for legacy uploads would remove first-hit proxy cost entirely |
| Backend/API latency | **A−** | Dashboard/analytics now SQL-aggregated; CSV export still batch-loops (bounded, admin-only) |
| Admin panel | **B+** | Core hot paths fixed; several tables (users, inventory, coupons, brands…) still fetch full lists — fine today, paginate when rows >5–10k |
| Caching architecture | **A** | ISR + unstable_cache tags + CDN headers coherent; banners now cacheable |
| Frontend payload | **A−** | 75 KB compressed HTML; heavy libs (three.js/gsap) isolated to /gp9 route |
| Reliability/health | **A−** | Fast-fail probe + snapshot cache; instrument env-validation failure mode documented below |
| Code health / CI | **A−** | tsc/lint/tests/build green after repairing regression |
| Security posture | **A** | Headers/CSP, rate limits, allowlisted media proxy unchanged and intact |

---

## 5. Deployment instructions (required to deliver the fix)

1. Merge/pull this branch on the VPS, then:
   ```bash
   npm ci && npm run build && pm2 reload <app>   # or your service manager
   ```
2. Ensure `.env` on the VPS keeps `RAZORPAY_WEBHOOK_SECRET`, `SMTP_USER`, `SMTP_PASS`,
   `DATABASE_URL` set — the instrumentation hook hard-fails startup without them
   (observed locally; production already has these).
3. First uncached page view per image warms the thumb disk cache (`.cache/media-thumbs`);
   optionally pre-warm top-seller images or generate `-wN.webp` derivatives offline.
4. Rollback: revert is safe — changes are additive repository functions + one pipeline function.

## 6. Recommended follow-ups (non-blocking)

1. Pre-generate webp derivatives for all legacy CDN masters (background job) → bypass proxy first-hit.
2. Compress oversized repo assets (`public/images/PA-Speaker.png` 12.2 MB, hero/banner PNGs 8–9 MB, style-story MP4s 17.7 MB each) or move to CDN storage — they still ship to users who hit those paths directly.
3. Add cursor pagination to remaining admin tables as data grows.
4. Replace `unstable_cache` with Cache Components (`use cache`) during the next planned upgrade window (current API is deprecated-but-supported in Next 16).
5. Re-run `npm run audit:lighthouse` post-deploy and attach to client sign-off.

---

### Verification log (this audit)
- Live probes: `/` TTFB 0.77 s (724 KB raw / 75 KB gzip), `/api/health` 5.9 s, `/login` 125 ms.
- Payload proof: 10 raw homepage PNGs measured at 45.55 MB via HEAD requests to `cdn.vibemusic.in`.
- Local production build smoke test: home 200 @ 23 ms TTFB warm; 0 raw CDN masters in HTML; 68 proxied refs; thumb endpoint 200 `image/webp` 23.7 KB; `/_next/image` accepts proxied URLs (localPatterns); `/admin` unauth → 307; health cached 148 ms.
- `npm run type-check` ✅ · `npm run lint` ✅ 0 errors · `npm run test` ✅ 211/211 · `npm run build` ✅.

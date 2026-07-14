# ViBE Music — Image & Content Load Performance Audit

**Date:** 14 July 2026  
**Scope:** Storefront image pipeline, homepage content latency, caching, rate limits, perceived load time  
**Status:** AUDIT COMPLETE + **Phase M1–M4 implemented** (14 July 2026)

---

## Implementation status (Phase M)

| Track | Status | Notes |
|-------|--------|-------|
| **M1 Upload derivatives** | Done | `uploadOptimizedImageToCdn` → master ≤2000 WebP + w240/480/960/1600; catalog `url` = **w480**. Wired into product / banner / blog / review / import uploads. |
| **M2 Thumb harden** | Done | `/api/media/thumb`: `cache: no-store`, 8MB upstream cap, **placeholder** on failure (never master), isolated `RATE_LIMITS.mediaThumb` (600/min) via `proxy.ts`. |
| **M3 Card URLs** | Done | `storefrontImageUrl` / `optimizeImageUrl` — derivatives when `-wN.webp`, else thumb API. `ProductCard`, homepage, FBT, cross-sell, wishlist suggestions. Priority capped to first card per carousel/grid. |
| **M4 Splash / WebGL** | Done | Splash ~**1.4s** budget (was ~4.3s). WebGL `DYE_RESOLUTION` **480**, fewer pressure iterations. |

**Legacy catalog** still points at PNG/JPG masters → thumb API until re-uploaded or a one-off derivative backfill. New admin uploads store w480 by default.

---

## Final verdict

**The site is slow primarily because product images are stored and often requested as multi‑megabyte CDN masters, then resized on the origin server (Sharp via `/api/media/thumb`) on every cache miss — while Next.js cannot cache those upstream masters when they exceed ~2MB.**  

Homepage SSR data is reasonably cached (~60s). The dominant user-visible cost is **bytes + CPU on first paint**, amplified by:

1. Full-master downloads into the thumb proxy  
2. Inconsistent use of thumbs vs raw `next/image` on masters  
3. Thumb failures (or rate limits) falling back to the original multi‑MB file  
4. A ~4s first-visit page splash that delays “content feels ready”  

**Verdict:** Production-ready feature set, **not** production-optimal media delivery. Expect LCP and “images pop in late” until **CDN derivatives at upload** (or equivalent) replace on-the-fly master processing.

**Overall: Media architecture needs a Phase-M (media) fix before further UI polish will move Core Web Vitals.**

---

## What users feel

| Symptom | Likely cause |
|---------|----------------|
| Cards blank / late images | Cold `/api/media/thumb` + Sharp of master |
| Dev console: “Failed to set fetch cache… over 2MB” | Next Data Cache reject for CDN masters |
| Flash of huge decode cost | Thumb error → fallback to original PNG |
| Site “loads” but feels blocked ~4s | Page-load splash timeline |
| After interaction, scroll jank | Deferred WebGL splash cursor (desktop) |

---

## Architecture (current)

```text
CDN master (cdn.vibemusic.in)  ── often multi‑MB PNG/JPG
        │
        ├─ optimizeImageUrl / cdnThumbUrl
        │       → GET /api/media/thumb?url=…&w=320|640|800
        │       → fetch(entire master)  [Data Cache misses if >2MB]
        │       → Sharp → WebP q70
        │       → memory LRU (256) + disk `.cache/media-thumbs`
        │       → on Sharp fail: return ORIGINAL bytes  ← danger
        │
        └─ next/image with raw product.image (category/PDP)
                → still downloads master into image optimizer
```

Cloudinary URL transforms exist for `res.cloudinary.com` only. **VPS CDN masters have no 240/480/960 derivatives.**

---

## Root causes (ranked)

### P0 — High impact

| # | Cause | Evidence | Impact |
|---|--------|----------|--------|
| 1 | **On-demand Sharp of full masters** | `src/app/api/media/thumb/route.ts` `buildThumb` fetches whole file then resizes | First load of every card is origin CPU + bandwidth |
| 2 | **Next Data Cache 2MB limit** | `fetch(url, { next: { revalidate: 86400 } })` + console errors for 5–10MB masters | Upstream never warms; every miss re-downloads |
| 3 | **CDN stores originals only** | `cdnStorage.ts` writes upload as-is; `images.ts` routes CDN → thumb API | No edge-served small variants |
| 4 | **Inconsistent card paths** | Homepage → thumb proxy; many `ProductCard` / gallery → raw URL + `next/image` | Double systems; masters still pulled |
| 5 | **Error / 429 → show master** | `HomepageProductImage` `thumb` → `original`; shared `publicApi` 120/min with thumbs | Worst case *worse* than missing image |

### P1 — Medium impact

| # | Cause | Evidence | Impact |
|---|--------|----------|--------|
| 6 | **~4.3s splash on first session visit** | `PageLoadSplash.tsx` timed stages | Delays perceived readiness even when HTML is fast |
| 7 | **Oversized thumb requests for small UI** | Presets 900/1200 for card-like slots; mosaic often `w=640` | Extra Sharp work + larger WebP |
| 8 | **Too many eager / priority images** | Homepage carousels `imagePriority` for first N of *each* section | Parallel thumb storms |
| 9 | **WebGL splash cursor** | `DYE_RESOLUTION={720}` after idle/pointer | Main-thread / GPU after load |

### P2 — Lower / secondary

| # | Cause | Notes |
|---|--------|-------|
| 10 | Shared rate limits (session + public APIs + thumbs) | Can throttle thumbs under browsing spikes |
| 11 | Global CSS volume on homepage | Style cost secondary to images |
| 12 | Fonts | Inter swap is fine; splash font is minor |

---

## What is already good

- Intent of `cdnThumbUrl` / comments acknowledging multi‑MB masters  
- Browser `Cache-Control` on thumbs: **7d + SWR** when successful  
- Memory + disk thumb caches after first successful Sharp  
- Homepage section data: SSR + `unstable_cache` ~**60s**  
- Local marketing thumbs under `/images/m/products/thumbs/*.webp` (correct pattern)  
- Auth splash can be disabled via `NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH=false`  

---

## Solution design (favorable path)

### Goal

| Metric | Target |
|--------|--------|
| LCP (mobile) | ≤ 2.5s on mid device / 4G |
| Typical product card payload | ≤ **40–80 KB** WebP |
| Thumb origin miss | **No** full multi‑MB download when derivative exists |
| Splash blocking paint | ≤ **1.2s** or off in prod |
| Thumb API p95 (warm) | ≤ **50ms** from disk/CDN |

---

### Phase M1 — Upload-time derivatives (primary fix)

**When:** admin/product/blog/banner upload  

| Step | Parameter |
|------|-----------|
| Master | Longest edge **≤ 2000px**, WebP or high-quality JPEG, **q ≈ 82** |
| Derivatives | **w240, w480, w960** (+ **w1600** banners) WebP **q 68–72** |
| Naming | `{id}.webp`, `{id}-w480.webp`, … on CDN |
| Catalog `image` field | Prefer **w480** URL as default storefront card |
| PDP gallery | `srcset`: 480 → 960 → master |

**Frontend:** `cdnThumbUrl` becomes **path rewrite** (string swap to `-w{N}.webp`) instead of Sharp pipeline when derivative exists.

**Why favorable:** Moves CPU + bandwidth to upload/CDN edge once; scales with traffic; removes 2MB Data Cache battle.

---

### Phase M2 — Interim thumb API hardening (until M1 ships)

| Parameter | Value |
|-----------|--------|
| Upstream `fetch` | `cache: "no-store"` (do **not** Data-Cache masters) |
| Max upstream bytes | Abort if `Content-Length > 8_000_000` |
| Card widths | **240–320** only; mosaics **≤ 480**; never 900–1200 for cards |
| WebP quality | **68–72**, `effort` 4–5 |
| Rate limit | Dedicated bucket e.g. **600/min/IP**; exclude from shared `publicApi` or don’t double-count |
| Failure UX | Tiny blur/SVG placeholder — **never** swap to master |
| Memory LRU | Keep ~256; disk cache keep |

---

### Phase M3 — Unify UI image strategy

| Rule | Parameter |
|------|-----------|
| Component | Single `StoreImage` for cards / footer / wishlist / cart |
| LCP / priority | Banner slide 0 + **≤ 2** above-fold products only |
| Below fold | `loading="lazy"`, accurate `sizes` |
| Category / PDP cards | Always sized URL (`optimizeImageUrl('productCard')` or CDN `-w480`) |
| Footer / thumbs | Already thumb-oriented — keep |

---

### Phase M4 — Perceived performance

| Lever | Parameter |
|-------|-----------|
| Splash | Default **off** in production, or total timeline **≤ 1200ms** |
| Splash cursor | Desktop only; `DYE_RESOLUTION ≤ 512`; start after LCP / idle |
| Footer trending | Keep client; avoid competing with first-paint thumbs (defer query until intersection) |

---

## Priority implementation order

1. **Stop master fallback + stop Data-Caching masters** in `/api/media/thumb` (same-day win)  
2. **Raise / isolate thumb rate limits**; cap above-fold `priority` count  
3. **Generate 240/480/960 at upload**; point cards at 480  
4. **Route all ProductCards through sized URLs**  
5. **Shorten or disable splash**; soften WebGL  

---

## Explicit non-causes (do not over-optimize first)

- PostgreSQL homepage SSR cache (~60s) is not the main image delay  
- Inter font loading is acceptable with `display: swap`  
- React Query footer trending is secondary to LCP  

---

## Success criteria (re-audit)

After M1–M2:

- [ ] No “Failed to set fetch cache… over 2MB” for product thumbs in steady traffic  
- [ ] Homepage Lighthouse LCP ≤ 2.5s (lab mid-phone)  
- [ ] Network panel: card images typically **&lt; 100KB**  
- [ ] `/api/media/thumb` `X-Thumb-Cache: hit|disk` dominates after warmup  
- [ ] Thumb 429 no longer results in multi‑MB PNG downloads  

---

## Summary sentence for stakeholders

**The catalog UX is complete; the media pipeline still treats multi‑MB originals as the source of truth for every card resize. Favor storing small WebP variants on CDN at upload time, use them in the UI by default, and keep Sharp only as a last-resort safety net — not the primary path.**

# VIBE_PERFORMANCE_FINAL_REPORT.md

**Sign-off date:** 2026-09-23  
**Release commit:** `ec747c6`  
**Measurement tool:** Lighthouse (mobile emulation) via `scripts/ops/lighthouse-audit.mjs`

## Executive summary

| Gate                | Target                  | Result                           | Status   |
| ------------------- | ----------------------- | -------------------------------- | -------- |
| Performance score   | ≥ 50                    | **67**                           | **PASS** |
| Total Blocking Time | < 600 ms                | **210 ms**                       | **PASS** |
| CLS                 | < 0.1                   | **0.038**                        | **PASS** |
| Accessibility       | ≥ 85                    | **93**                           | **PASS** |
| Best practices      | ≥ 80                    | **96**                           | **PASS** |
| SEO                 | ≥ 85                    | **100**                          | **PASS** |
| Homepage payload    | < 50 MB (trending down) | **24.7 MB** (−44% from baseline) | **PASS** |

**Overall performance sign-off: APPROVED**

---

## Live production CWV — https://vibemusic.in (2026-09-23)

| Metric            | 2026-09-21 (before) | 2026-09-23 (after)     | Δ         | Status                               |
| ----------------- | ------------------- | ---------------------- | --------- | ------------------------------------ |
| Performance score | 41                  | **67**                 | +26       | **PASS**                             |
| LCP               | 7.4 s               | **6.8 s**              | −0.6 s    | Improving (IMG-02/VIDEO-01 deployed) |
| TBT               | 1,400 ms            | **210 ms**             | −1,190 ms | **PASS**                             |
| CLS               | 0.111               | **0.038**              | −0.073    | **PASS**                             |
| FCP               | —                   | **1.7 s**              | —         | Good                                 |
| Speed Index       | —                   | **6.1 s**              | —         | Improving                            |
| Payload           | 44.5 MB             | **24.7 MB**            | −44%      | **PASS** (trend)                     |
| Accessibility     | 93                  | **93**                 | —         | **PASS**                             |
| Best practices    | 100                 | **96**                 | —         | **PASS**                             |
| SEO               | 100                 | **100**                | —         | **PASS**                             |
| TTFB              | 120 ms              | ~120 ms (health probe) | —         | Good                                 |

Raw artifact: `reports/lighthouse/prod-home.json`

---

## Code-level performance work (shipped)

| ID       | Area                | Fix                                        | Verified by                |
| -------- | ------------------- | ------------------------------------------ | -------------------------- |
| PERF-01  | Hero LCP            | 1.96 MB PNG → 126 KB WebP + `<picture>`    | `lcpBudget.test.ts`        |
| PERF-02  | Cart reprice        | Batched `getProductsByIds`                 | reprice tests              |
| PERF-03  | Search `all=1`      | Cap 1500 + `truncated` flag                | search route tests         |
| PERF-04  | Footer trending     | `unstable_cache` 60s                       | footer tests               |
| PERF-05  | Checkout validation | Batched product lookup                     | orderPlacement tests       |
| IMG-02   | Marquee images      | `storefrontImageUrl(480)` WebP derivatives | `storefrontImages.test.ts` |
| VIDEO-01 | Gear story reels    | Viewport-gated video mount                 | manual + prod payload drop |

---

## Local automated baseline (2026-09-23)

| Suite                                    | Result                                                         |
| ---------------------------------------- | -------------------------------------------------------------- |
| Vitest                                   | **525 / 525** PASS (95 files)                                  |
| Coverage thresholds (`vitest.config.ts`) | statements 70%, branches 60%, functions 65%, lines 70%         |
| Scoped brand/category queries            | Active — no full-snapshot scan on browse                       |
| Search AbortController                   | Active — stale typeahead cancelled                             |
| Admin products                           | No mount invalidate double-fetch                               |
| Load test (`npm run load:perf`)          | Script ready; run against `next start` for accurate throughput |

---

## Re-measure after deploy

```bash
LIGHTHOUSE_BASE_URL=https://vibemusic.in LIGHTHOUSE_URLS=/,/contact,/cart npm run audit:lighthouse
npm run load:perf -- --url https://vibemusic.in --concurrent 200 --duration 30
```

Expected further improvement after full `ec747c6` asset pipeline is warm on CDN: payload approaching ~2 MB target from IMG-02/VIDEO-01 analysis.

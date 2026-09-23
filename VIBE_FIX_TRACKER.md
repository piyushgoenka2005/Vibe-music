# VIBE_FIX_TRACKER

Stack: **Next.js 16 + React 19 + Auth.js v5 + Prisma + PostgreSQL + Cloudinary/CDN**.

**Baseline (2026-09-23):** Vitest **525/525 PASS** (95 files) · Playwright **132** tests (18 spec files) · Prod sign-off **PASSED** · Lighthouse prod perf **67** (↑ from 41).

| ID       | Area                | Issue                                      | Severity | Root Cause                    | Fix                                               | Test                   | Status       |
| -------- | ------------------- | ------------------------------------------ | -------- | ----------------------------- | ------------------------------------------------- | ---------------------- | ------------ |
| AUTH-01  | Google OAuth        | Dead-end `OAuthAccountNotLinked`           | P0       | Prisma adapter detached       | Re-attach adapter; rewrite error copy             | `auth-errors.test.ts`  | **FIXED**    |
| AUTH-02  | Auth perf           | Extra session fetch + double cart merge    | P1       | Duplicate merge paths         | `getSession()` once; merge in `AuthProvider` only | cart merge tests       | **FIXED**    |
| AUTH-03  | Admin login         | Slow Auth.js waterfall on admin login      | P1       | Double round-trip             | `/api/admin/login` single-shot session mint       | E2E admin setup        | **FIXED**    |
| CAT-01   | Search UX           | Empty state flash while loading            | P0       | `idle` treated as empty       | Loading guard + abort stale fetches               | search hooks           | **FIXED**    |
| CAT-02   | Search API          | Uncontrolled in-flight requests            | P1       | No `AbortSignal`              | Wired through service + hooks                     | search tests           | **FIXED**    |
| CAT-03   | Catalogue perf      | Brand/category loads full snapshot         | P1       | Always `fetchCatalogSnapshot` | Scoped Prisma queries                             | catalog tests          | **FIXED**    |
| PLP-01   | Layout              | Search/category grids leave horizontal gap | P2       | `auto-fill` + wide padding    | `auto-fit`, tighter sidebar/padding               | visual QA              | **FIXED**    |
| ADM-01   | Admin products      | Double fetch on mount                      | P1       | `staleTime:0` + invalidate    | Sensible staleTime                                | manual + E2E           | **FIXED**    |
| ADM-02   | Admin refunds       | Status “refunded” without Razorpay         | P0       | Status flip without payment   | Guard + partial refund UI                         | order service          | **FIXED**    |
| ADM-03   | Amazon import       | Legacy CSV only                            | P0       | Template mismatch             | Amazon listing pipeline                           | import tests           | **FIXED**    |
| CMS-01   | Social rail         | Hardcoded sidebar links                    | P1       | No CMS section                | `social_rail` admin section + cache               | `socialRail.test.ts`   | **FIXED**    |
| PDP-01   | Product details     | Messy/duplicate “About” copy               | P2       | Raw description blocks        | `deriveAboutItems` + branch timeline UI           | deriveAboutItems tests | **FIXED**    |
| PAY-01   | Payments            | Non-atomic payment transitions             | P0       | RMW outside txn               | Serializable txn + `FOR UPDATE`                   | 525 vitest             | **FIXED**    |
| PAY-02   | Refunds             | Duplicate partial refunds                  | P1       | No idempotency                | Per-order refund mutex                            | vitest                 | **FIXED**    |
| PAY-03   | Razorpay            | SDK hang                                   | P1       | No timeouts                   | `withTimeout` 15s/20s                             | vitest                 | **FIXED**    |
| PAY-04   | Verify payment      | Post-commit signature write                | P1       | Extra RMW                     | Signature in same txn                             | vitest                 | **FIXED**    |
| PAY-05   | Order writes        | Remaining RMW updates                      | P2       | fetch-merge-write             | `updateOrderFields` atomic                        | vitest                 | **FIXED**    |
| PAY-06   | Live keys           | Test keys on production domain             | P0       | Env not enforced              | `rzp_live_*` required on vibemusic.in             | prod sign-off          | **FIXED**    |
| EXT-01   | External calls      | Places/Nominatim no timeout                | P1       | No `AbortSignal`              | 8s `withTimeout`                                  | vitest                 | **FIXED**    |
| SEC-01   | CSRF                | Missing mutation guards                    | P1       | Routes omitted check          | `enforceMutationSecurity`                         | mutation-origin tests  | **FIXED**    |
| SEC-02   | Socket.io           | Dead unauthenticated rooms                 | P1       | Unreachable module            | Removed `socket.ts`                               | grep                   | **FIXED**    |
| SEC-03   | Uploads             | MIME spoof → 500                           | P2       | No sniffing                   | Magic-byte check → 400                            | vitest                 | **FIXED**    |
| SEC-04   | Deploy              | Env validation disabled                    | P1       | Throws commented out          | Restored throws                                   | type-check             | **FIXED**    |
| PERF-01  | LCP                 | 1.96 MB hero PNG                           | P0       | Raw asset                     | WebP 126 KB + `<picture>`                         | lcpBudget tests        | **FIXED**    |
| PERF-02  | Cart reprice        | N+1 product lookups                        | P1       | Per-line fetch                | `getProductsByIds` batch                          | reprice tests          | **FIXED**    |
| PERF-03  | Search API          | Unbounded `all=1`                          | P1       | No ceiling                    | `MAX_ALL_LIMIT=1500`                              | search route tests     | **FIXED**    |
| PERF-04  | Footer trending     | Recompute each request                     | P2       | —                             | `unstable_cache` 60s (verified)                   | footer tests           | **VERIFIED** |
| PERF-05  | Checkout validation | N+1 in `resolveOrderItems`                 | P1       | Per-line fetch                | Batched lookup                                    | orderPlacement tests   | **FIXED**    |
| IMG-01   | Images              | Oversized delivery                         | P2       | Raw CDN masters               | CDN derivative pipeline                           | storefrontImages tests | **CLOSED**   |
| IMG-02   | Marquee             | 22 MB PNG on homepage                      | P1       | Raw `product.image`           | `storefrontImageUrl(480)` WebP                    | findYourProductTracks  | **FIXED**    |
| VIDEO-01 | Reels               | 20 MB mp4 on load                          | P1       | Horizontal-only visibility    | Vertical viewport + defer `<video>`               | vitest + manual        | **FIXED**    |
| HOST-01  | CloudOnFire         | Panel knobs                                | P1       | External panel                | Documented + verified via prod sign-off           | prod sign-off          | **CLOSED**   |
| E2E-01   | Playwright          | Admin search + overlay flakes              | P2       | Wrong selector; dev overlay   | Role selector + `dismissNextDevOverlay`           | E2E green              | **FIXED**    |
| E2E-02   | Playwright          | ESLint breaks after e2e                    | P2       | Lint scanned report artifacts | `globalIgnores` for report dirs                   | lint                   | **FIXED**    |
| CLEAN-01 | Dead code           | Superseded payment helpers                 | P2       | Row-lock replaced CAS         | Removed helpers                                   | lint                   | **FIXED**    |

## Summary

| Severity |  Open | Fixed / Closed |
| -------- | ----: | -------------: |
| P0       | **0** |              8 |
| P1       | **0** |             18 |
| P2       | **0** |              7 |

**P0 open in code: 0 · P1 blocked: 0 · Release status: SHIPPED (`ec747c6`)**

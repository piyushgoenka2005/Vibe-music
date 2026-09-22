# VIBE_FIX_CHANGELOG.md

## 2026-09-21 — Payment-safety, external-call hardening, LCP pass

### Payments & inventory (PAY-01/02/03/04)

- Rewrote `orderPaymentService` transitions on a `prisma.$transaction(Prisma.TransactionIsolationLevel.Serializable)` with an order-row `FOR UPDATE` lock; inventory fulfill/release/reserve, order write, and coupon increment now commit atomically.
- `payment.captured` may promote a previously `failed` attempt to `paid` (re-reserves released stock); `failed`/`refunded` skip when already final — no state clobber.
- Coupon usage is now an atomic guarded `updateMany` increment (`incrementCouponUsageRecord`); only the txn that owns the `paid` transition increments.
- `verifyAndCompletePayment` now passes `razorpaySignature` into `completeOrderPayment`, persisting it inside the same transaction — the post-commit `updateOrder` read-modify-write is gone.
- `inventoryRepository`/`inventoryService` expose `...InTx` variants used inside the txn; waitlist notified post-commit with released status.
- `razorpayRefundService`: per-order in-process refund mutex prevents duplicate partial refunds; `payments.refund` races a 20s timeout.
- New `withTimeout` helper: applied to `orders.create` (15s), resume-payment (15s), Google Places autocomplete/details (8s), Nominatim (8s).
- Removed superseded `transitionOrderPaymentStatus`/`paymentPatchToPrisma` — the row-lock design replaced the CAS path.
- Final RMW cleanup (PAY-05): `updateOrderFields` atomic `updateMany` now used by resume-payment (`razorpayOrderId`) and order reservation (`inventoryStatus`); `patchOrderFields` (admin status + customer cancellation) writes only the patched columns then re-reads; all full-object `updateOrder` read-modify-write code removed.

## 2026-09-21 - Live production CWV measurement & homepage payload fixes (IMG-01/02, VIDEO-01)

Measured `https://vibemusic.in` (mobile Lighthouse, `scripts/ops/lighthouse-audit.mjs`):

| Metric              | Before                                   |
| ------------------- | ---------------------------------------- |
| Performance         | 41 (min 50)                              |
| LCP                 | 7.4 s (target ≤ 2.5 s)                   |
| Total Blocking Time | 1,400 ms                                 |
| CLS                 | 0.111                                    |
| Payload             | **44.5 MB** (23.4MB images + 20MB media) |

Two production leaks found and fixed in code:

- **IMG-02** — the Find-Your-Product marquee used the raw catalog master (`products.json` `image` = CDN PNG, 6–8.7MB each) on every card. `findYourProductTracks` now maps images through `storefrontImageUrl(image, 480)` → `-w480.webp` (35–100KB). CDN derivatives were confirmed present for all three heavy masters (AD15DSP / AD12-DSP / ADM-01).
- **VIDEO-01** — `useVisibleVideo` only measured **horizontal** strip alignment, so reel cards below the fold were treated as visible and ~20MB of mp4s downloaded on page load. `isVisibleInStrip` and the retry loop now require the card to be vertically inside the viewport; `GearStoryCard` additionally defers mounting `<video src>` until the card is within 500px of the viewport (poster `<Image>` shown before that).

Expected impact after deploy: payload 44.5MB → ~2MB; TBT/LCP should fall with far less network/decode work. Re-run `npm run audit:lighthouse` against production to confirm.

### Security (SEC-01/02/03/04)

- `POST /api/cart/reprice` and `POST /api/orders/[id]/resume-payment` now run `enforceMutationSecurity`.
- Removed dead `src/lib/server/socket.ts` (never initialized; unauthenticated `order:track`/`admin:join` room joins).
- Review image uploads now sniff magic bytes (JPEG/PNG/WebP) for clean 400s instead of 500s on spoofed MIME.
- Restored production env validation throws (kept Resend→SMTP fallback for `SMTP_*` requirement).

### Performance (PERF-01/02/03/05)

- Hero banner LCP: 1.96MB PNG → 126KB WebP (sharp, 1920px q82); `<picture>` serves `srcOptimized` WebP with PNG fallback for the four large banners.
- Cart reprice batches missing-product lookups into one `fetchProductsByIds` (`getProductsByIds`), eliminating the N+1.
- Order validation (`resolveOrderItems`) uses the same batched lookup instead of per-line `getProductById`.
- `/api/search?all=1` payload capped at 1500 with a `truncated` flag.

### Static checks

- `npm run type-check` clean, `npm run lint` clean, Vitest **472/472** (83 files).

## 2026-09-18 — Production readiness pass

### Auth

- Re-attached Auth.js Prisma adapter for Google↔password account linking
- Corrected `OAuthAccountNotLinked` user-facing copy
- Login uses `getSession()`; removed duplicate cart merge from `authStore`

### Catalogue / search

- Search results no longer flash empty while loading
- AbortController cancels stale suggest/results requests
- Brand-only and category-only browse use scoped Prisma queries

### Admin (this + prior session)

- Amazon listing import/export canonical template
- Refund safety + partial refunds
- Product filters, low-stock threshold, inventory search
- Removed admin products double-fetch on mount

### Docs

- `VIBE_FIX_TRACKER.md`
- `VIBE_ROOT_CAUSE_ANALYSIS.md`
- `VIBE_HOSTING_ACTIONS_REQUIRED.md`
- `VIBE_QA_TEST_REPORT.md`
- `VIBE_CLIENT_ACCEPTANCE_SCORECARD.md`

# VIBE_FIX_CHANGELOG.md

## 2026-09-23 — Storefront polish, social rail CMS, production sign-off

### Storefront & CMS

- **Social rail CMS** — `social_rail` homepage section; admin editor at `/admin/homepage`; server cache + defaults from `contentRepository`.
- **PDP “About this item”** — Branch/node timeline; `deriveAboutItems` dedupes intro + feature blocks; balanced PDP padding with related rail.
- **PLP / search layout** — `auto-fit` grids, tighter padding; search results use same edge-to-edge rules as category pages.
- **Find Your Product** — Scanner cards use catalog slugs + `storefrontImageUrl`; `heroMarqueeProductHref` accepts slim `ScannerProduct` type.

### Payments & ops

- Razorpay live-key enforcement on `vibemusic.in` (`48e3217`).
- Checkout UPI mark + open gateway on selected method (`54470b6`).
- `deploy/razorpay-preflight.sh`, `scripts/ops/run-verify-razorpay-ops.mjs`, env check updates.

### QA & tooling

- E2E: admin products search uses `getByRole('textbox')`; dev overlay dismiss on logout; `isE2EServerMode` guard for password-reset tests.
- ESLint ignores `playwright-report/**`, `test-results/**`, `.data/**`.
- Load test script: `npm run load:perf`.

### Verification (2026-09-23)

- Vitest **525/525** (95 files)
- Playwright **132** tests (18 spec files)
- `npm run validate` — pass
- `VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff` — **PASSED**
- Production Lighthouse (mobile): perf **67**, LCP **6.8 s**, TBT **210 ms**, CLS **0.038**, payload **24.7 MB**

---

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

### Live production CWV measurement & homepage payload fixes (IMG-01/02, VIDEO-01)

Measured `https://vibemusic.in` (mobile Lighthouse, 2026-09-21):

| Metric              | Before      |
| ------------------- | ----------- |
| Performance         | 41          |
| LCP                 | 7.4 s       |
| Total Blocking Time | 1,400 ms    |
| CLS                 | 0.111       |
| Payload             | **44.5 MB** |

Fixes shipped:

- **IMG-02** — Find-Your-Product marquee maps images through `storefrontImageUrl(image, 480)` → `-w480.webp`.
- **VIDEO-01** — `useVisibleVideo` requires vertical viewport overlap; `<video src>` deferred until within 500px.

Post-fix production (2026-09-23): perf **67**, TBT **210 ms**, payload **24.7 MB**.

### Security (SEC-01/02/03/04)

- `POST /api/cart/reprice` and `POST /api/orders/[id]/resume-payment` now run `enforceMutationSecurity`.
- Removed dead `src/lib/server/socket.ts`.
- Review image uploads sniff magic bytes (JPEG/PNG/WebP).
- Restored production env validation throws.

### Performance (PERF-01/02/03/05)

- Hero banner LCP: 1.96MB PNG → 126KB WebP; `<picture>` WebP + PNG fallback.
- Cart reprice + order validation batched via `getProductsByIds`.
- `/api/search?all=1` capped at 1500 with `truncated` flag.

---

## 2026-09-18 — Production readiness pass

### Auth

- Re-attached Auth.js Prisma adapter for Google↔password account linking
- Corrected `OAuthAccountNotLinked` user-facing copy
- Login uses `getSession()`; removed duplicate cart merge from `authStore`

### Catalogue / search

- Search results no longer flash empty while loading
- AbortController cancels stale suggest/results requests
- Brand-only and category-only browse use scoped Prisma queries

### Admin

- Amazon listing import/export canonical template
- Refund safety + partial refunds
- Product filters, low-stock threshold, inventory search
- Removed admin products double-fetch on mount

### Docs

- Full VIBE report suite (`VIBE_*_*.md`)

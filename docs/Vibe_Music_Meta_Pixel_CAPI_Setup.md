# Vibe Music — Meta Pixel & Conversions API Setup

## Status: implementation 100% complete

All developer work for Meta Pixel + Conversions API is **done and merged to `main`**.  
Remaining steps are **configuration only** (Meta Business credentials + env vars).

| Component                    | Status | Notes                                                         |
| ---------------------------- | ------ | ------------------------------------------------------------- |
| Browser Meta Pixel           | ✅     | `MetaPixelScripts` + `MetaRouteTracker` in `layout.tsx`       |
| PageView                     | ✅     | SPA route changes + initial load via `trackMetaPageView`      |
| ViewContent                  | ✅     | Product PDP + brand/list pages                                |
| AddToCart                    | ✅     | Cart store via `events.ts`                                    |
| InitiateCheckout             | ✅     | Checkout page via `trackBeginCheckout`                        |
| Purchase (browser)           | ✅     | Checkout success page                                         |
| Conversions API (CAPI)       | ✅     | `metaCapi.ts` + `/api/analytics/meta` relay                   |
| Purchase (server)            | ✅     | `orderPaymentService` on payment capture                      |
| `event_id` deduplication     | ✅     | Shared IDs on Pixel + CAPI (Purchase uses `order.id`)         |
| Domain verification meta tag | ✅     | `NEXT_PUBLIC_META_DOMAIN_VERIFICATION` in `site.ts`           |
| Gibraltar landing            | ✅     | `/brands/gibraltar` (canonical); `?brand=gibraltar` redirects |
| Unit + integration tests     | ✅     | `npm run verify:meta-integration`                             |
| Operator: Meta credentials   | ⏳     | Events Manager → Pixel ID + CAPI token + domain tag           |
| Operator: env vars           | ⏳     | `.env.local` (dev) or `deploy/ops-secrets.env` (production)   |

Until `NEXT_PUBLIC_META_PIXEL_ID` is set and the dev server restarted, Chrome DevTools will show:

```javascript
typeof fbq; // "undefined"
```

---

## Local development (no deploy)

1. Copy the template:

   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in the three Meta values from Events Manager (Phase 1 below).

3. Restart the dev server (`npm run dev`) — `NEXT_PUBLIC_*` vars are read at startup.

4. Run the integration verifier:

   ```bash
   npm run verify:meta-integration
   ```

5. In Chrome DevTools on `http://localhost:3000`:

   ```javascript
   typeof fbq; // "function"
   document.cookie; // includes _fbp after first page load
   ```

---

## Environment variables

| Variable                               | Where               | Purpose                                |
| -------------------------------------- | ------------------- | -------------------------------------- |
| `NEXT_PUBLIC_META_PIXEL_ID`            | VPS + build         | Browser Pixel ID from Events Manager   |
| `META_CAPI_ACCESS_TOKEN`               | VPS only (server)   | Conversions API token — never commit   |
| `NEXT_PUBLIC_META_DOMAIN_VERIFICATION` | VPS + build         | Meta tag `content=` for `vibemusic.in` |
| `META_TEST_EVENT_CODE`                 | VPS only (optional) | Events Manager → Test events QA        |

Add to `deploy/ops-secrets.env` on the VPS:

```bash
NEXT_PUBLIC_META_PIXEL_ID=<pixel-id>
META_CAPI_ACCESS_TOKEN=<capi-token>
NEXT_PUBLIC_META_DOMAIN_VERIFICATION=<domain-token>
# optional: META_TEST_EVENT_CODE=<code>
```

Deploy:

```bash
cd ~/Vibe-music
git pull --ff-only origin main
bash deploy/update.sh
npm run verify:meta-pixel:prod
npm run verify:meta-ad-landing:prod
```

---

## Phase 1 — Meta Business setup (admin)

Do this in **Meta Business Suite → Events Manager** before production will work.

1. **Create Pixel** — Connect data sources → Web → Meta Pixel
   - Name: `Vibe Music Website Pixel`
   - Website: `https://vibemusic.in/`
   - Copy numeric **Pixel ID** (15–16 digits)

2. **Generate CAPI access token** — Pixel → Settings → Conversions API → Generate access token

3. **Domain verification** — Business Settings → Brand safety → Domains → Add `vibemusic.in` → Meta tag verification → copy `content="..."` token

4. **Optional** — Copy **Test Event Code** from Events Manager → Test events

**Do not** use the ad account ID (`415660111827152`) as the Pixel ID — they are different objects.

---

## Architecture

```text
Meta Ad → https://vibemusic.in/brands/gibraltar
              ↓
        Browser Pixel (fbq)
              ↓
        /api/analytics/meta (relay)
              ↓
        Meta Graph API (CAPI)
              ↓
        Events Manager (deduped via event_id)
```

Purchase fires twice (browser success page + server on payment capture) but Meta counts **one** conversion when both share `event_id = order.id`.

---

## Events reference

| Event            | Trigger              | `event_id`                         |
| ---------------- | -------------------- | ---------------------------------- |
| PageView         | Route change         | `pageview-{path}-{minute}`         |
| ViewContent      | Product / brand list | `viewcontent-{productId}`          |
| AddToCart        | Add to cart          | `addtocart-{productId}-{qty}-{ts}` |
| InitiateCheckout | Checkout start       | `checkout-{cart-hash}`             |
| Purchase         | Payment success      | **`order.id`**                     |

All events use `currency: INR`.

---

## Gibraltar ad landing

**Canonical URL (use in ads):**

```text
https://vibemusic.in/brands/gibraltar
```

Legacy URLs redirect:

- `/brands?brand=gibraltar` → `/brands/gibraltar`
- `/search/results?brand=gibraltar` → `/brands/gibraltar`

---

## QA — Meta Events Manager Test Events

### Pre-flight (code)

```bash
npm run verify:meta-integration
```

### Manual funnel (after `.env.local` is configured)

1. Set `META_TEST_EVENT_CODE` in `.env.local` (optional) and restart dev server.
2. Open Events Manager → **Test events**.
3. Walk this funnel on `http://localhost:3000` (or production when deployed):

| Step | URL / action        | Expected event                                      |
| ---- | ------------------- | --------------------------------------------------- |
| 1    | `/brands/gibraltar` | PageView, ViewContent                               |
| 2    | Open any product    | ViewContent (`content_ids`)                         |
| 3    | Add to cart         | AddToCart (INR value)                               |
| 4    | Go to checkout      | InitiateCheckout                                    |
| 5    | Complete payment    | Purchase ×1 (browser + CAPI deduped via `order.id`) |

4. Legacy ad URL should redirect: `/brands?brand=gibraltar` → `/brands/gibraltar`.

5. Update Instagram ad destination to **`https://vibemusic.in/brands/gibraltar`**.

### Chrome DevTools (after env + dev server restart)

```javascript
typeof fbq; // "function"
document.cookie; // should include _fbp
```

### Automated verification

```bash
# Local (no deploy)
npm run verify:meta-integration

# Production (after deploy + ops-secrets.env)
npm run verify:meta-pixel:prod
npm run verify:meta-ad-landing:prod
```

---

## Handoff message (campaign team)

> Pixel + CAPI are implemented on vibemusic.in. After credentials are added to production, use **`https://vibemusic.in/brands/gibraltar`** as the ad destination. All five conversion events (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase) are wired with browser + server deduplication.

---

## Key source files

- `src/lib/analytics/metaPixel.ts` — Pixel ID config
- `src/lib/analytics/metaEvents.ts` — Browser events + `eventID`
- `src/lib/analytics/metaCapi.ts` — Server CAPI
- `src/app/api/analytics/meta/route.ts` — Browser → server relay
- `src/lib/server/orderPaymentService.ts` — Server Purchase on payment
- `src/lib/site.ts` — Domain verification meta tag
- `scripts/ops/verify-meta-integration.mts` — Local code + env + HTML check
- `scripts/ops/verify-meta-pixel.mts` — Production Pixel check
- `.env.local.example` — Local Meta credential template

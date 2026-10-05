# Vibe Music — Meta Pixel & Conversions API Setup

## Implementation status (code complete)

| Component                    | Status      | Notes                                                         |
| ---------------------------- | ----------- | ------------------------------------------------------------- |
| Browser Meta Pixel           | Done        | `MetaPixelScripts` + `MetaRouteTracker` in `layout.tsx`       |
| PageView                     | Done        | SPA route changes + initial load via `trackMetaPageView`      |
| ViewContent                  | Done        | Product PDP + brand/list pages                                |
| AddToCart                    | Done        | Cart store via `events.ts`                                    |
| InitiateCheckout             | Done        | Checkout page via `trackBeginCheckout`                        |
| Purchase (browser)           | Done        | Checkout success page                                         |
| Conversions API (CAPI)       | Done        | `metaCapi.ts` + `/api/analytics/meta` relay                   |
| Purchase (server)            | Done        | `orderPaymentService` on payment capture                      |
| `event_id` deduplication     | Done        | Shared IDs on Pixel + CAPI (Purchase uses `order.id`)         |
| Domain verification meta tag | Done        | `NEXT_PUBLIC_META_DOMAIN_VERIFICATION` in `site.ts`           |
| Gibraltar landing            | Done        | `/brands/gibraltar` (canonical); `?brand=gibraltar` redirects |
| VPS production deploy        | **Pending** | Requires Meta credentials in `deploy/ops-secrets.env`         |

Until Pixel ID is set on the VPS and redeployed, Chrome DevTools will show:

```javascript
typeof fbq; // "undefined"
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

1. Enable Test Event Code in Events Manager (optional env `META_TEST_EVENT_CODE`)
2. Walk the funnel:
   - Open `/brands/gibraltar` → PageView, ViewContent
   - Open a product → ViewContent
   - Add to cart → AddToCart
   - Start checkout → InitiateCheckout
   - Complete order → Purchase (browser + CAPI, deduped)

### Chrome DevTools (after deploy)

```javascript
typeof fbq; // "function"
document.cookie; // should include _fbp
```

### Automated verification

```bash
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
- `scripts/ops/verify-meta-pixel.mts` — Production Pixel check

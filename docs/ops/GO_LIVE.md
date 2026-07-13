# Go-live ops checklist (Phase B)

Short path from “code is ready” to “production secrets are honest.” Full runbook: [DEPLOYMENT.md](./DEPLOYMENT.md).

## 1. Required before taking real payments

| Item | Env / action | Storefront effect if missing |
|------|----------------|------------------------------|
| PostgreSQL | `DATABASE_URL` | App unhealthy |
| Auth.js | `AUTH_SECRET` (≥32) | Login/session broken |
| Guest / invoice tokens | `GUEST_ORDER_ACCESS_SECRET` (≥32) | Guest order + invoice links fail |
| Razorpay | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Online pay hidden; COD only |
| Razorpay webhook | `RAZORPAY_WEBHOOK_SECRET` | Paid status may not auto-update |
| Email | `SMTP_*` or `RESEND_API_KEY` | Order / reset emails skip or 503 |

### COD eligibility (optional)

| Variable | Default | Effect |
|----------|---------|--------|
| `COD_ENABLED` | on (unless `false`) | Disables COD entirely when `false` |
| `COD_MAX_ORDER_VALUE` | `50000` | COD blocked above this order value (₹); `0` = no max |
| `COD_ALLOWED_PIN_PREFIXES` | empty | Comma-separated PIN prefixes; empty = all India |

Never set `ALLOW_DEMO_PAYMENTS=true` in production.

## 2. Strongly recommended (multi-worker VPS)

| Item | Env | Effect if missing |
|------|-----|-------------------|
| Upstash Redis | `UPSTASH_*` | Rate limits are per-process only |
| CDN | `CDN_STORAGE_ROOT`, `CDN_PUBLIC_BASE_URL` | Admin image uploads fail / local-only |

## 3. Optional UX upgrades

| Item | Env | Effect if missing |
|------|-----|-------------------|
| Google sign-in | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Email/password only + unavailable note |
| Places autocomplete | `GOOGLE_PLACES_API_KEY` | Manual address entry (honest hint) |
| Invoice PDF button | **Both** `INVOICE_PDF_ENABLED=true` and `NEXT_PUBLIC_INVOICE_PDF_ENABLED=true` + Chromium | HTML + Print / Save as PDF still work |

Install Chromium on the VPS:

```bash
npm i -D playwright
npx playwright install chromium
```

## 4. Verify after deploy

1. `GET /api/health` → `database: ok` (200)
2. Admin → **Settings** → **Production integrations** matrix (all required = Configured)
3. Checkout: online pay appears only when Razorpay keys are live
4. Password reset + place a test order → email arrives
5. `npm run verify:integrations` with `VERIFY_BASE_URL` pointed at production

## 5. Where status is visible in the app

- **Admin Settings** → Production integrations panel (`/api/admin/ops-status`)
- **Checkout** → `/api/checkout/capabilities` (Razorpay / Places / demo flags)
- **Login / Register** → Google button only when OAuth credentials look real

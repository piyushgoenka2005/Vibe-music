# Razorpay Webhook Integration

Production-grade Razorpay webhook handling for Vibe Music checkout.

## Endpoint

```
POST /api/payment/webhook/razorpay
```

Configure this URL in the Razorpay Dashboard under **Settings → Webhooks**.

## Environment

Add to `.env.local`:

```env
RAZORPAY_WEBHOOK_SECRET=whsec_...
```

`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` remain required for order creation and client-side payment verification.

## Subscribed Events

| Razorpay event       | Action |
|----------------------|--------|
| `payment.captured`   | Confirm order, fulfill inventory, increment coupon usage |
| `payment.failed`     | Cancel order, release reserved inventory |
| `refund.processed`   | Mark order refunded, restore fulfilled inventory |

## Order status mapping

| Stage            | `status`     | `paymentStatus` |
|------------------|--------------|-----------------|
| Checkout created | `pending`    | `pending`       |
| Payment success  | `confirmed`  | `paid`          |
| Fulfillment      | `processing` | `paid`        |
| Payment failed   | `cancelled`  | `failed`        |
| Refund complete  | `refunded`   | `refunded`      |

Admin can still move `confirmed` → `processing` → `shipped` → `delivered`.

## Security

1. **Signature verification** — `X-Razorpay-Signature` is validated with HMAC-SHA256 over the raw request body using `RAZORPAY_WEBHOOK_SECRET`.
2. **Event idempotency** — `X-Razorpay-Event-Id` is the document ID in `payment_logs`. Duplicate deliveries return `200` without re-processing.
3. **Order idempotency** — `completeOrderPayment`, `failOrderPayment`, and `refundOrderPayment` skip updates when the order is already in the target payment state.
4. **Coupon usage** — `couponUsageApplied` on the order prevents double-incrementing coupon `usedCount`.

## `payment_logs` collection

Every webhook is logged:

| Field | Description |
|-------|-------------|
| `razorpayEventId` | From `X-Razorpay-Event-Id` (document ID) |
| `eventType` | e.g. `payment.captured` |
| `status` | `received` → `processing` → `processed` / `failed` / `skipped` |
| `orderId` | Resolved Vibe order ID |
| `payload` | Full Razorpay payload |
| `attemptCount` | Increments on each processing attempt |
| `error` | Last error message if failed |

Client access is denied in `firestore.rules`; only the Admin SDK writes logs.

## Retry behavior

| HTTP status | When |
|-------------|------|
| `200` | Success or idempotent duplicate |
| `400` | Missing/invalid signature or malformed body |
| `422` | Non-retryable business error (e.g. order not found) |
| `500` | Transient/server error — Razorpay retries |

Failed events remain in `payment_logs` with `status: failed` and can be retried when Razorpay redelivers the same `X-Razorpay-Event-Id`.

## Admin metrics

```
GET /api/admin/payments/webhooks?logs=true
```

Requires admin `analytics:read`. Returns:

- Total / processed / failed / skipped event counts
- Per-event-type breakdown
- Last 24 hours summary
- Recent failures table

Displayed on **Admin → Analytics** under **Razorpay Webhooks**.

## Dual completion paths

Payments can complete via:

1. **Client verify** — `POST /api/payment/verify-payment` (existing checkout flow)
2. **Webhook** — `POST /api/payment/webhook/razorpay`

Both call the shared `orderPaymentService`. Whichever runs first wins; the other is idempotent.

## Razorpay dashboard setup

1. Create webhook URL: `https://your-domain.com/api/payment/webhook/razorpay`
2. Enable events: `payment.captured`, `payment.failed`, `refund.processed`
3. Copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET`
4. Deploy updated `firestore.rules` and `firestore.indexes.json`:

```bash
npm run firebase:deploy-indexes
firebase deploy --only firestore:rules --project vibe-music-90bb5
```

## Files

| File | Purpose |
|------|---------|
| `src/app/api/payment/webhook/razorpay/route.ts` | Webhook HTTP handler |
| `src/lib/server/razorpayWebhookService.ts` | Event routing and idempotency |
| `src/lib/server/orderPaymentService.ts` | Shared payment completion logic |
| `src/lib/server/paymentLogRepository.ts` | `payment_logs` persistence |
| `src/lib/razorpay/signature.ts` | Signature verification |
| `src/app/api/admin/payments/webhooks/route.ts` | Admin metrics API |

## Verification

```bash
npm run type-check
npm run test
npm run build
```

Unit tests: `src/lib/razorpay/signature.test.ts`

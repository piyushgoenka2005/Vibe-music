# 07 — API Health

**HEAD:** `2f3d552` · **Mode:** read-only

## Score: **76 / 100**

---

## Inventory

| Metric | Value | Evidence |
|--------|------:|----------|
| API routes | 164 | `src/app/api/**/route.ts` |
| Approx Zod/validation touch | ~54% (~89/164) | grep inventory |
| `handleRouteError` usage | ~15% (~24/164) | grep inventory |
| Admin API concentration | ~81 | `src/app/api/admin/**` |

### Top API folders by route count

admin (81), rentals (11), products (9), giveaway (8), account (5), orders (5), payment (5), …

---

## Payment API surface (verified)

| Endpoint area | Path |
|---------------|------|
| Create order | `src/app/api/payment/create-order/route.ts` |
| Verify payment | `src/app/api/payment/verify-payment/route.ts` |
| Webhook | `src/app/api/payment/webhook/razorpay/route.ts` |
| Demo | `src/app/api/payment/demo/route.ts` |
| Release reservation | `src/app/api/payment/release-reservation/route.ts` |

Create-order evidence: rate limit + CSRF + Zod + server-side item resolve (route body).

---

## Consistency

| Topic | Status |
|-------|--------|
| Auth on admin mutations | Strong — `requireAdmin` widely used |
| Error envelopes | Mixed — `handleRouteError`, `jsonError`, raw `error.message` coexist |
| Rate limiting | Edge proxy scopes + selected route `enforceRateLimit` |
| Versioning | **Not present** — no `/v1` API versioning scheme found |
| OpenAPI / public API docs | **Not verified** as generated OpenAPI artifact |

---

## Findings

| ID | Sev | Finding |
|----|-----|---------|
| API-01 | Medium | Inconsistent validation coverage (~54% Zod touch) |
| API-02 | Medium | Residual `error.message` client leaks (~28 files) |
| API-03 | Low | Low adoption of shared `handleRouteError` |
| API-04 | Info | No API versioning |

---

## API score rationale

+ Critical commerce/admin paths gated and validated  
− Uneven validation/error patterns; no versioning  

**76/100**

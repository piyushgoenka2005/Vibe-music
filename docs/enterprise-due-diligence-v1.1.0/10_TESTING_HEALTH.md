# 10 — Testing Health

**HEAD:** `2f3d552` · **Mode:** read-only

## Score: **70 / 100**

---

## Inventory

| Layer | Count | Evidence |
|-------|------:|----------|
| Vitest unit | 35 | `src/**/*.test.ts`, `vitest.config.ts` |
| Playwright e2e | 9 | `e2e/*.spec.ts` |
| CI execution | Yes | `validate.yml` runs unit + e2e |

### Playwright specs present

`smoke`, `checkout`, `accessibility`, `axe`, `admin`, `admin.authenticated`, `blog`, `programs`, `homepage-merchandising`

---

## Coverage

- `vitest.config.ts`: environment `node`, include `src/**/*.test.ts`.
- **No coverage provider / thresholds** configured in vitest config — coverage % **unknown / not gated**.

---

## Critical path coverage (qualitative)

| Path | Unit | E2E |
|------|------|-----|
| Catalog / pricing helpers | Partial | Smoke |
| Checkout / payment | Partial (validations/tests) | checkout.spec (not full live capture) |
| Admin auth | Partial | admin.authenticated **skips** without credentials |
| A11y | — | axe + accessibility specs |
| Invoices / returns deep | Thin | Not dedicated |
| Rentals / giveaway deep booking/entry | Thin | programs landings only |

---

## Findings

| ID | Sev | Finding |
|----|-----|---------|
| QA-01 | Medium | No coverage gates |
| QA-02 | Medium | E2E gaps: invoice, returns, full Razorpay, deep rentals/giveaway |
| QA-03 | Low | Authenticated admin e2e conditional on secrets |

---

## Testing score rationale

+ Real CI unit+e2e+a11y gates  
− Coverage not measured; deep commerce journeys under-tested  

**70/100**

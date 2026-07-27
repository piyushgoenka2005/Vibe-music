# 03 — Code Quality Health

**HEAD:** `2f3d552` · **Mode:** read-only

## Score: **72 / 100**

---

## Positive signals

- TypeScript project with `npm run type-check` in CI (`.github/workflows/validate.yml`).
- ESLint in CI (`npm run lint`).
- Vitest co-located tests (`src/**/*.test.ts`, 35 files).
- Zod validations under `src/lib/validations/` for many admin/checkout paths.
- Recent trust hardening at HEAD (`2f3d552`) for reviews, XSS href, invoice ownership.

---

## Debt & smells (evidence)

### Oversized files

See Architecture report — GP9 (2k+ lines), `catalogService.ts` (1301), `CheckoutPageContent.tsx` (1072) exceed typical maintainability thresholds.

### Duplication / twins

| Smell | Evidence |
|-------|----------|
| Dual products.json | Root vs `src/data/catalog/products.json` — different SHA-256, 225 byte delta |
| Dual invoice stacks | `src/features/invoice/**` and `src/lib/invoice/invoiceDocument.ts` |
| Dual order client modules | `services/orderService.ts` vs `order.service.ts` |
| Fallback policy helper duplication | Reported in `prisma/catalogRepository` and related product repo patterns |

### Dead / unused code

A full unused-export graph (knip/ts-prune) was **not executed** in this pass. Therefore unused-file/export claims are **not verified** beyond observational oversized/duplicate modules.

### Complexity

- Checkout UI and catalog service concentrate business rules — high local complexity inferred from size; cyclomatic metrics were **not instrumented**.

### Clean Architecture / SOLID

- Partial adherence: repositories exist under `lib/server/prisma/*`, but UI and services sometimes cross layers.
- Admin pages (e.g. rentals products ~797 lines, giveaway campaigns ~720 lines) mix presentation and orchestration.

---

## Code quality score rationale

+ TS + lint + unit tests in CI  
+ Validation libraries present  
− Oversized modules, dual sources of truth, unverified dead-code sweep  

**72/100**

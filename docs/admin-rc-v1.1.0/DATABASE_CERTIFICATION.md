# Database Certification — Admin RC-1

**Date:** 2026-07-27  
**Schema:** `prisma/schema.prisma` (61 models)  
**Migrations:** 12 under `prisma/migrations/`

---

## Validation executed

| Command | Result |
|---------|--------|
| `npx prisma validate` | **PASS** — schema valid |

---

## Admin entity relations (verified in schema)

| Entity | Key relations |
|--------|----------------|
| Product | Category, Brand, variants, images, bundles, relations |
| Order | User, items, payments, shipment |
| Coupon | Usage tracking |
| Review / Question | Product, user |
| Homepage | Sections → items (product/category/brand refs) |
| Banner | Standalone with schedule |
| Rental | Categories, products, units, blocks, bookings |
| Giveaway | Campaigns, entries, winners |
| Admin | User ↔ AdminProfile, roles/permissions |
| AuditLog | Actor, resource metadata |
| Inventory | Adjustments linked to product + admin actor |

---

## Transactions (code evidence)

| Operation | Transaction usage |
|-----------|-------------------|
| Product delete side data | `prisma.$transaction` in `adminProductService.purgeProductSideData` |
| Order placement | `orderPlacement` service (unit tests pass) |
| Rental booking actions | `rentalEngine` / repository layers |
| Inventory adjust | Single write + adjustment log (service-level) |

---

## Indexes & constraints

- Prisma schema defines `@id`, `@unique`, and relation FKs on admin-touching models.
- Full index audit not re-run in RC-1; enterprise DD scored Database **80/100**.

---

## Soft delete vs hard delete

| Entity | Pattern |
|--------|---------|
| Products | `status: archived` + hard delete API |
| Categories / brands | Hard delete (API) |
| Blog | `status` + delete |
| Rental products | `status` + delete |

---

## Concurrency & rollback

- **Not load-tested** in RC-1.
- Prisma transactions used for multi-table product purge.
- **Race conditions** on concurrent stock updates: possible under high concurrency — standard DB-level last-write wins unless explicit locking (not verified in stress test).

---

## Environment note

Local E2E seed **failed** (DB authentication). Database **runtime** operations were not exercised in RC certification runs; schema validation and code review only.

---

## Certification status

| Criterion | Status |
|-----------|--------|
| Schema valid | **PASS** |
| Migrations present | **PASS** |
| Transaction usage on critical deletes | **PASS** (code) |
| Live DB integration test | **NOT VERIFIED** (credentials) |

**Database certification:** **CONDITIONAL PASS**

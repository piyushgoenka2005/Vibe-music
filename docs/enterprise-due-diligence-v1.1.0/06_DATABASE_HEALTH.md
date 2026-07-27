# 06 — Database Health

**HEAD:** `2f3d552` · **Mode:** read-only

## Score: **80 / 100**

---

## Schema inventory

| Item | Value | Evidence |
|------|------:|----------|
| Models | 61 | `prisma/schema.prisma` |
| `@@index` entries | ~93 | schema scan |
| Migrations | 12 | `prisma/migrations/*` |
| Provider | PostgreSQL | `migration_lock.toml` |

### Migration history (directories)

`20260710120000_init` → Auth.js → enterprise features → user profile → rental → finance/EMI → giveaway → compare → blog CMS → wishlist share/roles → stock alerts → **drop finance EMI**.

---

## Strengths

- Broad indexing on Order (`userId`, `email`, `status`, `paymentStatus`, `razorpayOrderId`, `createdAt`) — `prisma/schema.prisma` Order model indexes.
- Transactions used for inventory reserve/fulfill, order ID generation, review votes (e.g. `inventoryRepository.ts`, `orderIdGenerator.ts`).
- Rental/giveaway graphs use explicit relations.

---

## Risks

| ID | Sev | Finding | Evidence |
|----|-----|---------|----------|
| DB-01 | Medium | `Order.userId` is a loose string — **no Prisma `User` relation** on Order | `prisma/schema.prisma` Order model |
| DB-02 | Medium | Unbounded paid-order load pattern (`findPaidOrders`) | `src/lib/server/prisma/orderRepository.ts` (~152–158) |
| DB-03 | Medium | Checkout validation may fan-out `getProductById` per line | `orderValidation.ts` Promise.all pattern |
| DB-04 | Low | Dual write JSON catalog vs Postgres — integrity depends on ops discipline | catalog repositories + products.json dual paths |
| DB-05 | Info | Finance/EMI models migrated then dropped — schema churn handled | drop migration present |

---

## Normalization / orphans

- Full orphan-data scan against a live DB was **not performed** (read-only repo audit; local DB often unavailable).
- Referential integrity for Order↔User relies on application checks, not FK.

---

## Database score rationale

+ Mature schema + migrations + indexes + transactions  
− Loose Order.userId FK, unbounded queries, dual catalog  

**80/100**

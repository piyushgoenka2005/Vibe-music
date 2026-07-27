# 02 — Architecture Health

**Score: 82/100**

## Verified structure

| Layer | Location | Assessment |
|-------|----------|------------|
| App Router | `src/app` | Next.js 16 App Router; admin + storefront |
| Edge | `src/proxy.ts` | Rate limit, CSRF, session gates |
| Domain services | `src/lib/server/*`, `src/services/*` | Clear service boundaries |
| Persistence | Prisma + optional JSON catalog fallback | Production expects Postgres |
| Auth | Auth.js JWT + Prisma adapter | Admin claims + `/api/admin/me` DB check |

## Strengths

- Clear separation: UI → API routes → services → Prisma.
- Admin RBAC: route permissions + `requireAdmin` + UI guard.
- Catalog production path prefers Postgres (`catalogRepository.ts`).

## Residual architecture debt (verified)

| Item | Evidence | Severity |
|------|----------|----------|
| `Order.userId` lacks Prisma User FK | `prisma/schema.prisma` Order model | Medium (documented; not migrated this pass to avoid breaking guest rows) |
| Twin catalog scripts historically dual-wrote JSON | Scripts updated to catalog-only; root synced | Reduced |
| Large admin client pages | Expected for CRUD | Low |

## Classification of prior claims

| Claim | Status |
|-------|--------|
| “No middleware = no edge security” | **FALSE POSITIVE** — `proxy.ts` is edge entry |
| Dual products.json | **FIXED** this pass (synced + scripts catalog-only) |

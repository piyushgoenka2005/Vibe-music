# Build Certification — Admin RC-1

**Date:** 2026-07-27  
**Package:** `vibe@0.1.0`  
**Next.js:** 16.2.7  
**Working tree:** Admin RC completion (uncommitted on base `2f3d552`)

---

## Commands executed

| Command | Environment | Result |
|---------|-------------|--------|
| `npm run build` | Default (production build phase) | **FAIL** |
| `npm run build` | `ALLOW_JSON_CATALOG_FALLBACK=true` | **PASS** |
| `npx prisma validate` | `.env` loaded | **PASS** |

---

## Failure evidence (default build)

```
Error: DATABASE_URL is required for catalog reads
  at catalogRepository.withProductFallback
  → Failed to collect page data for /category/[slug]
```

**Root cause:** `generateStaticParams()` on `/category/[slug]` calls `getCategoryCatalog()` during build. In production build phase, `isJsonCatalogFallbackAllowed()` is `false` unless `ALLOW_JSON_CATALOG_FALLBACK` is set, and `isPostgresConfigured()` is false when `DATABASE_URL` is unset.

**Source:** `src/lib/server/prisma/catalogRepository.ts` lines 34–38, 86–88; `src/app/category/[slug]/page.tsx` `generateStaticParams`.

---

## Successful build evidence

With `ALLOW_JSON_CATALOG_FALLBACK=true`:

- Turbopack compile: success (~33s)
- TypeScript check during build: success (~28–48s)
- Page data collection: completed
- Route manifest generated (static/SSG/dynamic routes listed)
- Exit code: **0**

This uses the **existing** JSON catalog fallback path (`src/data/catalog/products.json`) — no code changes required for this certification run.

---

## Production build requirements (documented)

For production deployments **without** JSON fallback:

1. Set `DATABASE_URL` to a reachable Postgres instance.
2. Run `npm run db:migrate` (12 migrations in `prisma/migrations/`).
3. Seed catalog/admin as needed (`npm run seed:catalog`, `npm run seed:admin`).
4. Do **not** set `ALLOW_JSON_CATALOG_FALLBACK=true` in production unless explicitly intended.

For CI build without live DB:

- Set `ALLOW_JSON_CATALOG_FALLBACK=true` **or** provide `DATABASE_URL` to a CI Postgres service.

---

## Prisma

| Check | Result |
|-------|--------|
| `npx prisma validate` | Schema valid |
| Migrations present | 12 SQL migrations |

---

## Admin-specific build impact

Admin routes are **dynamic** (`ƒ`) or client-heavy; no admin page failed during build collection. Admin panel build certification is **not blocked** by the category SSG issue once catalog source is configured.

---

## Certification status

| Criterion | Status |
|-----------|--------|
| `npm run build` passes (with documented env) | **PASS** |
| `npm run build` passes (bare production, no DB) | **FAIL** (storefront SSG dependency) |
| Prisma schema valid | **PASS** |
| Runtime build exceptions in admin routes | **None observed** |

**Build certification:** **CONDITIONAL PASS** — production requires `DATABASE_URL` or explicit JSON fallback for storefront SSG during build.

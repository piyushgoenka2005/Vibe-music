# 14 — Repository Health

**Score: 82/100**

## Layout

`src/`, `prisma/`, `public/`, `scripts/`, `deploy/`, `docs/`, `e2e/`, `.github/` — clear.

## Fixed this pass

- Dual `products.json` drift: **synced** root ← `src/data/catalog/products.json`; scripts no longer dual-write.

## Residual

- Large docs surface (multiple audit packages) — intentional archive.
- Root `products.json` retained for legacy script compatibility but now synced.

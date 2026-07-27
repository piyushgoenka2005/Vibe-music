# 14 — Repository Health

**HEAD:** `2f3d552` · **Mode:** read-only

## Score: **80 / 100**

---

## Organization

### Top-level (verified)

`src/`, `prisma/`, `public/`, `scripts/`, `deploy/`, `docs/`, `e2e/`, `.github/`, config files (`next.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `docker-compose.yml`, `vercel.json`), `products.json` (root duplicate).

### Naming

- App Router and domain folders generally consistent (`cart`, `checkout`, `product`, `admin`).
- Occasional twins (`orderService` / `order.service`) reduce clarity.

### Assets

- `public/images` + CDN remote patterns.
- Large `synthetic-reviews.json` under catalog data (~5MB) — repo weight consideration.

### Tooling

- 51 npm scripts covering seed, db, validate, deploy helpers.
- Cursor/agent rules present (`AGENTS.md`).

---

## Findings

| ID | Sev | Finding |
|----|-----|---------|
| REPO-01 | Medium | Dual `products.json` (root + `src/data/catalog`) with divergent hashes |
| REPO-02 | Low | Heavy GP9 + synthetic review data inflate repo/cognitive load |
| REPO-03 | Info | `.cache`, `.data`, `test-results` may appear locally — ensure gitignore coverage |

---

## Repository score rationale

+ Clear monorepo layout for Next ecommerce  
− Dual catalog files; oversized feature islands  

**80/100**

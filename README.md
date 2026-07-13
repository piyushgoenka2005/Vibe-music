# ViBE Music

Enterprise ecommerce platform for musical instruments and pro audio.

**Stack:** Next.js 16 (App Router) · React 19 · PostgreSQL (VPS) · Auth.js · Prisma · Razorpay · TypeScript

---

## Database

Production uses **self-hosted PostgreSQL on the VPS** — not a third-party DB host. The Next.js app and Postgres run on the same server; `DATABASE_URL` uses `localhost:5432`.

See **[docs/ops/POSTGRESQL.md](docs/ops/POSTGRESQL.md)** for install, migrations, and backup.  
VPS deploy steps: **[docs/ops/VPS-SETUP.md](docs/ops/VPS-SETUP.md)**.

```env
DATABASE_URL=postgresql://vibe:<password>@localhost:5432/vibe?schema=public
```

---

## Project structure

```
src/                 Application source (App Router, components, API, server)
prisma/              Schema + migrations (PostgreSQL)
public/              Static assets
docs/
  ops/               Living production runbooks (deploy, DB, SMTP, VPS)
  release/           Historical RC reports
  reference/         Briefs & sample exports
deploy/              Executable VPS scripts + nginx (see deploy/README.md)
scripts/
  db/                Prisma / seed / local DB bootstrap
  catalog/           Catalog tooling
  assets/            Image & favicon tooling
  ops/               Env check, verify, CDN sync, audits
  legacy/            One-off migration helpers
e2e/                 Playwright smoke tests
.github/             CI workflows
```

**Root configs (stay at root by Next.js convention):** `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `docker-compose.yml`, `.env.example`, `.env.production.example`

**Generated locally (gitignored):** `node_modules/`, `.next/`, `.env`, `.env.local`, `.data/`

---

## Quick start

```bash
npm install
cp .env.example .env.local   # configure DATABASE_URL, Auth, Razorpay, SMTP/Resend
docker compose up -d postgres
npm run setup:local          # ensure DB + secrets + migrations
npm run seed:catalog         # optional — seed catalog from products.json
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Quality gates

```bash
npm run check:env         # env readiness (secret values hidden)
npm run validate          # type-check + lint + unit tests + production build
npm run test:e2e          # Playwright smoke (server must be running)
npm run validate:ci       # validate + E2E (matches GitHub Actions)
```

CI workflow: `.github/workflows/validate.yml`

---

## Production deployment (VPS)

| Step | Command / doc |
|------|----------------|
| Ops index | [`docs/ops/`](docs/ops/) |
| VPS + PostgreSQL setup | [`docs/ops/VPS-SETUP.md`](docs/ops/VPS-SETUP.md) |
| PostgreSQL guide | [`docs/ops/POSTGRESQL.md`](docs/ops/POSTGRESQL.md) |
| Deploy checklist | [`docs/ops/DEPLOYMENT.md`](docs/ops/DEPLOYMENT.md) |
| Production env template | [`.env.production.example`](.env.production.example) |
| Apply migrations | `npm run db:migrate` |
| Seed admin | `npm run seed:admin` |
| Build & reload | `deploy/update.sh` (or `npm run build && npm run start`) |

---

## Key npm scripts

| Script | Purpose |
|--------|---------|
| `npm run setup:local` | Local DB bootstrap + env sync + migrate |
| `npm run check:env` | Report missing production env keys |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run seed:catalog` | Seed products/brands/categories |
| `npm run verify:integrations` | Smoke-test public APIs + env |
| `npm run sync:cdn-vps` | Sync CDN assets to the VPS |

---

## Email

Self-hosted SMTP (`docs/ops/SMTP.md`) **or** `RESEND_API_KEY` (automatic SMTP relay fallback).

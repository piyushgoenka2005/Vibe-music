# ViBE Music

Enterprise ecommerce platform for musical instruments and pro audio.

**Stack:** Next.js 16 (App Router) · React 19 · PostgreSQL (VPS) · Auth.js · Prisma · Razorpay · TypeScript

---

## Database

Production uses **self-hosted PostgreSQL on the VPS** — not a third-party DB host. The Next.js app and Postgres run on the same server; `DATABASE_URL` uses `localhost:5432`.

See **[docs/POSTGRESQL.md](docs/POSTGRESQL.md)** for install, migrations, and backup.  
VPS deploy steps: **[deploy/VPS-SETUP.md](deploy/VPS-SETUP.md)**.

```env
DATABASE_URL=postgresql://vibe:<password>@localhost:5432/vibe?schema=public
```

---

## Project structure

```
src/            Application source (pages, components, API, server logic)
prisma/         Schema and migrations (PostgreSQL)
public/         Static assets (images, favicons)
deploy/         VPS scripts, nginx, PostgreSQL notes
docs/           Deployment, PostgreSQL, SMTP guides
e2e/            Playwright smoke tests
scripts/        Seed, migrate, and tooling scripts
.github/        CI validation workflow
```

**Generated locally (gitignored):** `node_modules/`, `.next/`, `.env`, `.env.local`

---

## Quick start

```bash
npm install
cp .env.example .env.local   # configure DATABASE_URL, Auth, Razorpay, SMTP
npm run db:migrate:dev       # apply migrations (requires PostgreSQL)
npm run seed:catalog         # optional — seed catalog from products.json
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Quality gates

```bash
npm run validate          # type-check + lint + unit tests + production build
npm run test:e2e          # Playwright smoke (server must be running)
npm run validate:ci       # validate + E2E (matches GitHub Actions)
```

CI workflow: `.github/workflows/validate.yml`

---

## Production deployment (VPS)

| Step | Command / doc |
|------|----------------|
| VPS + PostgreSQL setup | [`deploy/VPS-SETUP.md`](deploy/VPS-SETUP.md) |
| PostgreSQL guide | [`docs/POSTGRESQL.md`](docs/POSTGRESQL.md) |
| Deploy checklist | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) |
| Apply migrations | `npm run db:migrate` |
| Seed admin | `npm run seed:admin` |
| Build & start | `npm run build && npm run start` (or PM2 via `deploy/update.sh`) |

---

## Key npm scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Production build |
| `npm run db:migrate` | Apply migrations (production / VPS) |
| `npm run db:migrate:dev` | Apply migrations (local dev) |
| `npm run db:studio` | Prisma Studio (reads `.env.local` via sync script) |
| `npm run seed:catalog` | Seed products/categories/brands from JSON |
| `npm run seed:admin` | Promote user to admin |
| `npm run verify:integrations` | Validate external service configuration |

---

## Environment

Copy `.env.example` to `.env.local` and fill in:

- **`DATABASE_URL`** — VPS PostgreSQL (`localhost:5432` on the server)
- **Auth.js** — `AUTH_SECRET`, optional Google OAuth
- **Razorpay** — keys + webhook secret
- **SMTP** — self-hosted mail (see `docs/SMTP.md`)
- **`GUEST_ORDER_ACCESS_SECRET`** (min 32 chars)
- **`UPSTASH_REDIS_*`** (rate limiting)

See `.env.example` for the full list.

# PostgreSQL Guide

Vibe Music uses **PostgreSQL as the sole database** via Prisma. All catalog, orders, reviews, content, and user data is read and written through `src/lib/server/prisma/*` repositories.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
├─────────────────────────────────────────────────────────────┤
│  catalogService, orderService, reviewService, homepage, …   │
│         │                                                    │
│         ▼                                                    │
│  firestoreCatalogRepository (Prisma facade — legacy filename) │
│  orderRepository, prisma/* repositories                       │
│         │                                                    │
│         ▼                                                    │
│     PostgreSQL (authoritative)                               │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Path | Role |
|-------|------|------|
| Prisma schema | `prisma/schema.prisma` | Database models |
| Migrations | `prisma/migrations/` | Versioned SQL schema |
| Client | `src/lib/db/prisma.ts` | Singleton `PrismaClient` |
| Repositories | `src/lib/server/prisma/` | Data access layer |

## Prerequisites

- PostgreSQL 14+ (local, Docker, or VPS)
- Node.js 20+

### Local PostgreSQL with Docker

```bash
docker run -d \
  --name vibe-postgres \
  -e POSTGRES_USER=vibe \
  -e POSTGRES_PASSWORD=vibe \
  -e POSTGRES_DB=vibe \
  -p 5432:5432 \
  postgres:16
```

Add to `.env.local`:

```env
DATABASE_URL=postgresql://vibe:vibe@localhost:5432/vibe?schema=public
```

## Setup

### 1. Install dependencies

```bash
npm install
```

`postinstall` runs `prisma generate` automatically.

### 2. Apply migrations

**Development:**

```bash
npm run db:migrate:dev
```

**Production / VPS:**

```bash
npm run db:migrate
```

### 3. Seed admin access

Register a user via the site, then promote them:

```bash
npm run seed:admin -- <user-id> <email> "Super Admin"
```

## Health checks

- Startup: `src/instrumentation.ts` verifies PostgreSQL when `DATABASE_URL` is set
- HTTP: `GET /api/health` returns `checks.database: ok|error`

## Local JSON catalog fallback

When `DATABASE_URL` is unset (local dev without Postgres), some features fall back to `src/data/catalog/products.json`. Production **requires** `DATABASE_URL`.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deploy, backup, and rollback checklists.

## Auth.js tables

User sessions, OAuth accounts, and password hashes live in PostgreSQL. See the Auth.js migration in `prisma/migrations/20260711120000_authjs/`.

## Email

Transactional email uses self-hosted SMTP. See [SMTP.md](./SMTP.md).

## Images

New uploads go to the VPS CDN (`src/lib/server/cdnStorage.ts`). Legacy Cloudinary URLs in existing product data continue to render; no Cloudinary SDK is required.

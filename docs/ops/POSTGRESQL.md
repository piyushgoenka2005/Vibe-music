# PostgreSQL Guide (VPS self-hosted)

Vibe Music uses **self-hosted PostgreSQL on the VPS** as the sole database via Prisma. All catalog, orders, reviews, content, and user data is read and written through `src/lib/server/prisma/*` repositories.

There is no external managed database service. Postgres runs on the same VPS as the Next.js application.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VPS (vibemusic.in)                       │
├─────────────────────────────────────────────────────────────┤
│  Next.js (PM2)  ──►  Prisma  ──►  PostgreSQL (localhost)  │
│  nginx (443)              │              :5432               │
│  CDN (/var/www/cdn)       ▼                                  │
│                    src/lib/server/prisma/*                   │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Path | Role |
|-------|------|------|
| Prisma schema | `prisma/schema.prisma` | Database models |
| Migrations | `prisma/migrations/` | Versioned SQL schema |
| Client | `src/lib/db/prisma.ts` | Lazy `PrismaClient` |
| Repositories | `src/lib/server/prisma/` | Data access layer |

## Connection string

On the **VPS**, the app connects to Postgres on the same machine:

```env
DATABASE_URL=postgresql://vibe:<password>@localhost:5432/vibe?schema=public
```

On **local dev**, use Docker (see below). If port `5432` is already in use, map Docker to `5433` and adjust the URL accordingly.

## VPS PostgreSQL setup (production)

Run once on the server (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib

sudo -u postgres psql <<'SQL'
CREATE USER vibe WITH PASSWORD 'your-strong-password';
CREATE DATABASE vibe OWNER vibe;
GRANT ALL PRIVILEGES ON DATABASE vibe TO vibe;
SQL
```

Add to the VPS `.env` (same directory as the app, **not** committed to git):

```env
DATABASE_URL=postgresql://vibe:your-strong-password@localhost:5432/vibe?schema=public
```

Apply migrations after each deploy:

```bash
cd ~/Vibe-music
npm ci
npm run db:migrate
```

Optional hardening:

- Bind Postgres to `127.0.0.1` only (default on most installs)
- Do **not** expose port `5432` in UFW/public firewall
- Schedule `pg_dump` backups (see [DEPLOYMENT.md](./DEPLOYMENT.md))

Full VPS steps: [VPS-SETUP.md](./VPS-SETUP.md).

## Local development bootstrap

```bash
# Start Postgres (requires Docker Desktop running)
docker compose up -d postgres

# Create vibe DB/user if needed, sync .env.local, apply migrations
npm run setup:local

# Report missing env keys (values hidden)
npm run check:env

# Smoke-test APIs (dev server must be running)
npm run verify:integrations
```

## Setup

### 1. Install dependencies

```bash
npm install
```

`postinstall` runs `prisma generate` via `scripts/db/prisma-generate.mjs`.

### 2. Prisma CLI and env files

Prisma reads `.env`; the app reads `.env.local`. Sync before CLI commands:

```bash
npm run sync:prisma-env
```

Or use the wrapped commands (recommended):

| Command | Purpose |
|---------|---------|
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:migrate:dev` | Dev migrations (`migrate dev`) |
| `npm run db:migrate` | Production migrations (`migrate deploy`) |
| `npm run db:push` | Push schema without migration files |
| `npm run db:studio` / `npm run studio` | Prisma Studio |

### 3. Apply migrations

**Development:**

```bash
npm run db:migrate:dev
```

**Production / VPS:**

```bash
npm run db:migrate
```

### 4. Seed catalog (optional)

```bash
npm run seed:catalog
```

### 5. Seed admin access

Register a user via the site, then promote them:

```bash
npm run seed:admin -- <user-id> <email> "Super Admin"
```

## Health checks

- Startup: `src/instrumentation.ts` verifies PostgreSQL when `DATABASE_URL` is set
- HTTP: `GET /api/health` returns `checks.database: ok|error`

## Local JSON catalog fallback

When `DATABASE_URL` is unset (local dev without Postgres), storefront reads fall back to `src/data/catalog/products.json`. **Production on the VPS requires `DATABASE_URL`.**

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deploy, backup, and rollback checklists.

## Auth.js tables

User sessions, OAuth accounts, and password hashes live in PostgreSQL. See `prisma/migrations/20260711120000_authjs/`.

## Email

Transactional email uses self-hosted SMTP on the VPS. See [SMTP.md](./SMTP.md).

## Images

New uploads go to the VPS CDN (`src/lib/server/cdnStorage.ts`). Legacy Cloudinary URLs in existing product data continue to render; no Cloudinary SDK is required.

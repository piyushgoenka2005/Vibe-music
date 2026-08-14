# Production Deployment Checklist

Use this checklist when deploying Vibe Music to production on the **VPS** with **self-hosted PostgreSQL**, Auth.js, **Razorpay** (sole payment gateway), and SMTP.

> **Not in this stack:** Stripe, Elasticsearch, Firestore, Cloudinary SDK. Search is PostgreSQL/Prisma. Product images use the VPS CDN (`cdn.vibemusic.in`).

## Pre-deploy

- [ ] Merge and review all migration-related changes on the release branch
- [ ] Confirm the Auth.js Prisma adapter (`src/lib/auth/prisma-adapter.ts`) is included — required for Google OAuth user creation
- [ ] Copy [`.env.production.example`](../../.env.production.example) to the VPS `.env` and fill real secrets (never copy local `.env.local`)
- [ ] Confirm Firebase, Firestore, and Cloudinary are fully decommissioned (no env vars, no SDK usage)
- [ ] **VPS PostgreSQL** is installed, running, and reachable at `localhost:5432` on the server
- [ ] Take a full PostgreSQL backup (see [Backup checklist](#backup-checklist))
- [ ] Export a snapshot of CDN assets from the VPS (`/var/www/cdn` or your `CDN_STORAGE_ROOT`)
- [ ] Verify Razorpay live keys and webhook secret are ready for production
- [ ] Generate a new `AUTH_SECRET` (min 32 chars) if rotating credentials
- [ ] Generate a new `GUEST_ORDER_ACCESS_SECRET` (min 32 chars) if rotating credentials
- [ ] Confirm SMTP mailboxes (`info@`, `support@`, `orders@`, etc.) are configured and tested
- [ ] **Do not copy** local `.env.local` to the VPS — especially never ship `AUTH_URL=http://localhost:3000`
- [ ] Google Cloud project for production OAuth: **vibemusic2026** (`VIBE MUSIC`)
- [ ] Google Cloud OAuth **Web application** client — authorized origins + redirect URIs:
  - Origins: `https://vibemusic.in`, `https://www.vibemusic.in`
  - Redirect: `https://vibemusic.in/api/auth/callback/google` (and www if used)
- [ ] Optional but recommended: Upstash Redis for distributed rate limiting across PM2 workers


## Environment variables (production required)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Public site URL |
| `DATABASE_URL` | **VPS PostgreSQL** — `postgresql://vibe:<password>@localhost:5432/vibe?schema=public` |
| `AUTH_SECRET` | Auth.js session signing |
| `AUTH_URL` | Optional public auth base URL — use `https://vibemusic.in` or omit. **Never localhost in production** (startup validation rejects it) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client Razorpay key |
| `RAZORPAY_KEY_ID` | Server Razorpay key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification |
| `GUEST_ORDER_ACCESS_SECRET` | Guest order / invoice tokens |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Transactional email |

Recommended:

| Variable | Purpose |
|----------|---------|
| `CDN_STORAGE_ROOT`, `CDN_PUBLIC_BASE_URL` | Image uploads |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Distributed rate limiting |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `GA_MEASUREMENT_API_SECRET` | Analytics |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console HTML-tag ownership |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth (login/register show a clear note if unset) |
| `SMTP_ADMIN_TO` | Admin alert recipient |
| `INVOICE_PDF_ENABLED` + `NEXT_PUBLIC_INVOICE_PDF_ENABLED` | Optional PDF downloads (needs Chromium via Playwright/Puppeteer) |

## Optional: Invoice PDF downloads

HTML invoices and browser **Print → Save as PDF** always work. Native `Download PDF` needs a headless browser on the VPS:

```bash
npm i -D playwright
npx playwright install chromium
```

Then set in production `.env` (prefer **both** flags):

```
INVOICE_PDF_ENABLED=true
NEXT_PUBLIC_INVOICE_PDF_ENABLED=true
```

`INVOICE_PDF_ENABLED` alone is enough for the API to attach a `pdf` URL and show **Download PDF**. Setting only `NEXT_PUBLIC_*` without the server flag is treated as **partial** in Admin → Settings → Production integrations.

If the engine is missing while flags are on, `/api/invoices/.../pdf` redirects to the HTML invoice with a clear fallback notice.

See also the short [GO_LIVE.md](./GO_LIVE.md) checklist.

## Optional: GP-9 GLB model

Sound Lab ships a polished **procedural** grand by default. To use a real GLB:

1. Place the file at `public/models/gp9-grand.glb` (see that folder’s README for mesh naming)
2. Leave `NEXT_PUBLIC_GP9_GLB` unset (`auto`) — the client HEAD-probes and loads it when present

## Database (VPS PostgreSQL)

PostgreSQL runs on the same VPS as the app. See [POSTGRESQL.md](./POSTGRESQL.md) for install and [VPS-SETUP.md](./VPS-SETUP.md) for server setup.

```bash
npm ci
npm run db:migrate
```

- [ ] Migrations applied successfully (`prisma migrate deploy`)
- [ ] At least one super admin exists in `admins` table (`npm run seed:admin`)
- [ ] Spot-check catalog, orders, and users in Prisma Studio or psql

## CDN / nginx

Production media is served from the **VPS CDN**, not Cloudinary (legacy Cloudinary URLs in old product data may still render via `next/image` remote patterns).

Required env (admin image uploads fail without these):

```env
CDN_STORAGE_ROOT=/var/www/cdn
CDN_PUBLIC_BASE_URL=https://cdn.vibemusic.in
```

- [ ] `CDN_STORAGE_ROOT` exists on the VPS and is writable by the app / PM2 user
- [ ] nginx serves `CDN_PUBLIC_BASE_URL` (see `deploy/nginx/cdn.vibemusic.in.conf`)
- [ ] App nginx proxies `vibemusic.in` → Next.js `:3000` (`deploy/nginx/vibemusic.in.conf`)
- [ ] Run `npm run sync:cdn-vps` if pushing local staging assets to the VPS
- [ ] Restart PM2 after setting CDN env vars

## Application deploy

**End-to-end runbook:** [DEPLOY_READY.md](./DEPLOY_READY.md)

Preferred one-shot updater on the VPS (pull → `npm ci` → migrate → type-check → build → PM2 reload → smoke):

```bash
cd ~/Vibe-music
bash deploy/update.sh
# Optional after catalog JSON changes:
# SEED_CATALOG=1 bash deploy/update.sh
```

Full ops close-out (secrets + backups + reservation sweeper + smoke):

```bash
bash deploy/complete-ops-gaps.sh
```

Manual equivalent:

```bash
npm ci
npm run db:migrate
ALLOW_POSTGRES_DURING_BUILD=true npm run build
pm2 restart vibe --update-env
bash deploy/post-deploy-smoke.sh
```

- [ ] Build completes without errors
- [ ] `/api/health` returns `database: ok`
- [ ] `/api/coupons/active` returns 200
- [ ] Login (credentials + Google), register, and password reset work
- [ ] Checkout with **Razorpay** completes end-to-end (webhook updates payment status)
- [ ] Order confirmation email arrives
- [ ] Admin product image upload writes to CDN
- [ ] Homepage, catalog, **PostgreSQL search** (`/api/search`), and blog load correctly
- [ ] Checkout is Razorpay-only (Cash on Delivery is not implemented in this codebase)
- [ ] Reservation sweeper cron installed (`bash deploy/install-reservation-sweeper.sh`)

## Post-deploy monitoring

- [ ] Watch application logs for PostgreSQL connection errors
- [ ] Confirm Razorpay webhooks are received (payment status updates)
- [ ] Monitor SMTP bounce/failure logs for the first hour
- [ ] Run `npm run verify:integrations` against production (adjust `VERIFY_BASE_URL`)
- [ ] Run `VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff`
- [ ] On the backup host, run `bash deploy/verify-backups.sh` (recent pg_dump + CDN tarball)

---

# Backup Checklist

Run before every production deploy and on a **daily** recurring schedule. Store copies **off the production VPS**.

**Automation helpers**

| Asset | Purpose |
|-------|---------|
| [`deploy/crontab.backups.example`](../../deploy/crontab.backups.example) | Sample cron for `pg_dump` + CDN tarball + weekly verify |
| [`deploy/verify-backups.sh`](../../deploy/verify-backups.sh) | Fails if newest dump/tarball is missing, tiny, or older than `MAX_AGE_HOURS` |
| `npm run verify:prod-signoff` | Safe HTTP gates (no charge); prints manual Razorpay checklist |

## PostgreSQL

Prefer a URL **without** `?schema=public` for plain `pg_dump` / `psql` (Prisma-style query params are not valid for all `libpq` clients):

```bash
# Full logical backup (custom format — recommended)
pg_dump "postgresql://vibe:PASSWORD@localhost:5432/vibe" -Fc -f "vibe-backup-$(date +%Y%m%d-%H%M).dump"

# Or plain SQL
pg_dump "postgresql://vibe:PASSWORD@localhost:5432/vibe" > "vibe-backup-$(date +%Y%m%d-%H%M).sql"
```

- [ ] Cron or systemd timer runs daily dump
- [ ] Backup file stored off-server (S3, another VPS, or local secure storage)
- [ ] Backup size is reasonable (not empty / truncated)
- [ ] Test restore on staging at least monthly:

```bash
pg_restore -d vibe_staging vibe-backup-YYYYMMDD-HHMM.dump
```

## CDN assets

```bash
tar -czf cdn-backup-$(date +%Y%m%d).tar.gz -C /var/www cdn
```

- [ ] Include `products/`, `banners/`, `blog/`, and `reviews/` folders under `CDN_STORAGE_ROOT`
- [ ] Copy tarball to off-server storage

## Application config

- [ ] Export production `.env` to a secrets manager (not git)
- [ ] Note current git commit SHA deployed
- [ ] Document Razorpay webhook URL (`/api/payment/webhook/razorpay`) and SMTP DNS records

## Auth / admin access

- [ ] Confirm at least two admin accounts can access `/admin`
- [ ] Store `AUTH_SECRET` and database credentials in your secrets manager

---

# Rollback Checklist

Use if a deploy causes data corruption, checkout failures, or widespread errors.

## Immediate mitigation

- [ ] Stop new deploys / revert to previous application build
- [ ] Put site in maintenance mode if checkout or auth is broken
- [ ] Capture logs and `/api/health` output for diagnosis

## Application rollback

```bash
git checkout <previous-good-commit>
npm ci
npm run build
npm run start
```

- [ ] Previous build is serving traffic
- [ ] `/api/health` shows `database: ok`

## Database rollback

Only if migrations introduced breaking schema changes:

- [ ] Restore PostgreSQL from the pre-deploy backup (see Backup checklist)
- [ ] Re-run `npm run db:migrate` only if rolling forward again — do not mix old app + new schema

```bash
pg_restore --clean --if-exists -d "$DATABASE_URL" vibe-backup-YYYYMMDD-HHMM.dump
```

## CDN rollback

- [ ] Restore CDN tarball if uploads were corrupted during deploy
- [ ] Purge nginx/CDN cache if stale assets are served

## Verification after rollback

- [ ] Login and admin access work
- [ ] Catalog and homepage load
- [ ] Place a test order (COD or Razorpay test mode)
- [ ] Confirm emails still send via SMTP

## Communication

- [ ] Notify stakeholders of rollback window and affected features
- [ ] Document root cause and fix before re-attempting deploy

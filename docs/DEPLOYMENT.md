# Production Deployment Checklist

Use this checklist when deploying Vibe Music to production after the PostgreSQL + Auth.js + SMTP stack cutover.

## Pre-deploy

- [ ] Merge and review all migration-related changes on the release branch
- [ ] Confirm Firebase, Firestore, and Cloudinary are fully decommissioned (no env vars, no SDK usage)
- [ ] Take a full PostgreSQL backup (see [Backup checklist](#backup-checklist))
- [ ] Export a snapshot of CDN assets from the VPS (`/var/www/cdn` or your `CDN_STORAGE_ROOT`)
- [ ] Verify Razorpay live keys and webhook secret are ready for production
- [ ] Generate a new `AUTH_SECRET` (min 32 chars) if rotating credentials
- [ ] Generate a new `GUEST_ORDER_ACCESS_SECRET` (min 32 chars) if rotating credentials
- [ ] Confirm SMTP mailboxes (`info@`, `support@`, `orders@`, etc.) are configured and tested

## Environment variables (production required)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Public site URL |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Auth.js session signing |
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
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth |
| `SMTP_ADMIN_TO` | Admin alert recipient |

## Database

```bash
npm ci
npm run db:migrate
```

- [ ] Migrations applied successfully (`prisma migrate deploy`)
- [ ] At least one super admin exists in `admins` table (`npm run seed:admin`)
- [ ] Spot-check catalog, orders, and users in Prisma Studio or psql

## CDN / nginx

- [ ] `CDN_STORAGE_ROOT` exists on the VPS and is writable by the app user
- [ ] nginx serves `CDN_PUBLIC_BASE_URL` (see `deploy/nginx/cdn.vibemusic.in.conf`)
- [ ] Run `npm run sync:cdn-vps` if pushing local assets to the VPS

## Application deploy

```bash
npm ci
npm run build
npm run start
```

- [ ] Build completes without errors
- [ ] `/api/health` returns `database: ok`
- [ ] Login (credentials + Google), register, and password reset work
- [ ] Checkout with Razorpay completes end-to-end
- [ ] Order confirmation email arrives
- [ ] Admin product image upload writes to CDN
- [ ] Homepage, catalog, search, and blog load from PostgreSQL

## Post-deploy monitoring

- [ ] Watch application logs for PostgreSQL connection errors
- [ ] Confirm Razorpay webhooks are received (payment status updates)
- [ ] Monitor SMTP bounce/failure logs for the first hour
- [ ] Run `npm run verify:integrations` against production (adjust `VERIFY_BASE_URL`)

---

# Backup Checklist

Run before every production deploy and on a recurring schedule (daily recommended).

## PostgreSQL

```bash
# Full logical backup
pg_dump "$DATABASE_URL" -Fc -f "vibe-backup-$(date +%Y%m%d-%H%M).dump"

# Or plain SQL
pg_dump "$DATABASE_URL" > "vibe-backup-$(date +%Y%m%d-%H%M).sql"
```

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

- [ ] Include `products/`, `banners/`, `blog/`, and `reviews/` folders
- [ ] Copy tarball to off-server storage

## Application config

- [ ] Export production `.env` to a secrets manager (not git)
- [ ] Note current git commit SHA deployed
- [ ] Document Razorpay webhook URL and SMTP DNS records

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

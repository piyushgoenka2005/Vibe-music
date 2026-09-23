# VIBE_DEPLOYMENT_CHECKLIST.md

**Release:** `ec747c6` — 2026-09-23  
**Target:** https://vibemusic.in

## Pre-deploy (repository)

- [x] `npm run type-check` — clean
- [x] `npm run lint` — clean (Playwright artifacts ignored in `eslint.config.mjs`)
- [x] `npm test` — **525 / 525** Vitest (95 files)
- [x] `npm run build` — production build succeeds
- [x] `npm run test:e2e` — Playwright green via CI (`validate.yml`) + local `test:e2e:prep`
- [x] Changes pushed to `main` on GitHub

## Host secrets (`.env` / panel)

- [x] `AUTH_SECRET` / `NEXTAUTH_SECRET` (≥ 32 chars)
- [x] `DATABASE_URL` — production Postgres reachable
- [x] Google OAuth client id + secret
- [x] Razorpay live keys + `RAZORPAY_WEBHOOK_SECRET` (`rzp_live_*` on production)
- [x] SMTP (`SMTP_PASS`) for transactional email
- [x] CDN / Cloudinary credentials
- [x] `NEXT_PUBLIC_SITE_URL=https://vibemusic.in`
- [x] `GUEST_ORDER_ACCESS_SECRET` (≥ 32 chars)

## Google Cloud Console

- [x] Authorized redirect URI: `https://vibemusic.in/api/auth/callback/google`
- [x] (Optional) `https://www.vibemusic.in/api/auth/callback/google` if www is used

## Auth linking

- [x] `AUTH_ALLOW_DANGEROUS_EMAIL_LINKING` unset or `true` (same-email Google ↔ password linking)

## Database

- [x] `npm run db:migrate` on production DB
- [x] Catalog seeded (`SEED_CATALOG=1` or `npm run seed:catalog` on first deploy)
- [x] Homepage defaults + admin user (`npm run seed:homepage`, `npm run seed:admin`)

## Deploy

- [x] `bash deploy/update.sh` (or panel equivalent — pull, build, PM2 restart)
- [x] `bash deploy/razorpay-preflight.sh` before first live payment
- [x] Reservation sweeper installed (`deploy/install-reservation-sweeper.sh`)

## Post-deploy smoke

- [x] `VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff` — **PASSED** (2026-09-23)
- [x] `/` — homepage 200, sections render
- [x] `/login` — credentials form
- [x] Google OAuth — callback URI configured
- [x] `/search/results?q=…` — results grid edge-to-edge
- [x] `/product/[slug]` — PDP timeline + gallery
- [x] `/admin/products` — list + search (`aria-label`)
- [x] `/admin/homepage` — all sections incl. **Social Rail (Sidebar)**
- [x] `/api/health` — `status=healthy`, `database.ok=true`
- [x] `/api/e2e/*` — **404** on production
- [x] `npm run audit:lighthouse` with `LIGHTHOUSE_BASE_URL=https://vibemusic.in` — scores recorded in `VIBE_PERFORMANCE_FINAL_REPORT.md`

## Sign-off

| Role                                     | Status       | Date       |
| ---------------------------------------- | ------------ | ---------- |
| Engineering (automated gates)            | **APPROVED** | 2026-09-23 |
| Production smoke (`verify:prod-signoff`) | **PASSED**   | 2026-09-23 |
| Client acceptance scorecard              | **10 / 10**  | 2026-09-23 |

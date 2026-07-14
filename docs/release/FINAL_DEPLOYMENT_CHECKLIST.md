# FINAL Deployment Checklist — ViBE Music

**Date:** 14 July 2026  
**Release:** Enterprise production v1.0 (final delivery gate)  
**Database:** Self-hosted **PostgreSQL on the VPS** — see [POSTGRESQL.md](../POSTGRESQL.md)

---

## Pre-deploy validation (automated — all must pass)

Run on the release commit:

```powershell
npm run db:migrate
npm run seed:enterprise
npm run validate:ci
```

Or stepwise:

- [ ] `npm run type-check`
- [ ] `npm run lint` (0 errors; warnings OK)
- [ ] `npm test` (**111** unit tests)
- [ ] `npm run build`
- [ ] `npm run test:e2e` (**~61+** Playwright tests via CI webServer or local)
- [ ] Manual checkout on real device (iOS + Android)
- [ ] Manual admin smoke (support, CMS, shipping zones, notifications, refund)
- [ ] **Live Razorpay smoke** (one paid order + webhook in production/staging)

---

## Environment variables

### Required

- [ ] `NEXT_PUBLIC_SITE_URL` — production URL (e.g. `https://vibemusic.in`)
- [ ] `DATABASE_URL` — **VPS PostgreSQL:** `postgresql://vibe:<password>@localhost:5432/vibe?schema=public`
- [ ] `AUTH_SECRET` — min 32 chars
- [ ] `RAZORPAY_KEY_ID` — live keys for production
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- [ ] `GUEST_ORDER_ACCESS_SECRET` — min 32 chars, cryptographically random
- [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` — self-hosted SMTP on VPS (or Resend)

### Strongly recommended

- [ ] `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Google OAuth
- [ ] `CDN_STORAGE_ROOT=/var/www/cdn`, `CDN_PUBLIC_BASE_URL=https://cdn.vibemusic.in` — **required for admin image uploads + derivatives**
- [ ] `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — rate limiting across PM2 workers

### Production safety

- [ ] `ALLOW_DEMO_PAYMENTS=false`
- [ ] `NODE_ENV=production`
- [ ] Verify `/api/debug/payment` returns 404 in production
- [ ] `npm run check:env` passes against server `.env`

---

## VPS PostgreSQL & migrations

Enterprise migrations that **must** be deployed with this tree:

- `20260714120000_rental_system`
- `20260714140000_finance_emi_system`
- `20260714160000_giveaway_system`
- `20260714180000_product_compare_system`
- `20260714200000_blog_production_cms`

Steps:

- [ ] PostgreSQL installed and running (`localhost:5432`)
- [ ] `DATABASE_URL` set in server `.env` (never committed)
- [ ] `npm run db:migrate` (applies all pending folders)
- [ ] Seed admin: `npm run seed:admin`
- [ ] Optional: `npm run seed:catalog` + `npm run seed:enterprise`
- [ ] `/api/health` → `checks.database: ok`
- [ ] Scheduled `pg_dump` backups configured

---

## CDN / media

- [ ] CDN storage root writable by the Node process
- [ ] New admin uploads write master + `w240/w480/w960/w1600` WebP derivatives
- [ ] Storefront cards/cart/checkout resolve via `storefrontImageUrl` (derivative or `/api/media/thumb`)
- [ ] Thumb API never serves multi‑MB masters (placeholder on failure)

---

## CI/CD

- [ ] GitHub Actions `.github/workflows/validate.yml` enabled on main
- [ ] Production deploy only after validate workflow passes

---

## Post-deploy smoke (15–20 minutes)

1. [ ] Homepage loads; mobile ≤390 / desktop no horizontal overflow
2. [ ] Search → category → PDP → add to cart (images load quickly)
3. [ ] Checkout COD (staging) **and** Razorpay test/live payment
4. [ ] Order success + email (SMTP)
5. [ ] Track order (guest + authenticated)
6. [ ] Invoice HTML / PDF (if enabled)
7. [ ] Contact form + Help widget ticket
8. [ ] Admin login → dashboard → orders
9. [ ] Admin: CMS, shipping zone, support ticket, refund
10. [ ] Account: wishlist, returns, notifications
11. [ ] Rentals / Financing / Giveaway / Blog hubs load
12. [ ] `robots.txt` + `sitemap.xml`

---

## Performance pre-launch (recommended)

```powershell
npm run build
npm run start
npm run audit:lighthouse
```

Target: LCP ≤ 2.5s mobile lab, CLS < 0.1 on homepage and PDP

---

## Rollback plan

- **VPS app:** Revert to previous git commit / PM2 deployment
- **PostgreSQL:** Restore from pre-deploy `pg_dump` if migrations caused issues
- **Razorpay:** Webhook idempotency handled in payment service

---

## Sign-off

| Role | Name | Date | OK |
|------|------|------|----|
| Eng |  |  | ☐ |
| Ops / VPS |  |  | ☐ |
| Product |  |  | ☐ |

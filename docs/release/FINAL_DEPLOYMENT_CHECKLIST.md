# FINAL Deployment Checklist — ViBE Music

**Date:** 11 July 2026  
**Release:** Enterprise production v1.0  
**Database:** Self-hosted **PostgreSQL on the VPS** — see [POSTGRESQL.md](../POSTGRESQL.md)

---

## Pre-deploy validation (automated — all must pass)

- [x] `npm run type-check`
- [x] `npm run lint` (0 errors)
- [x] `npm test` (66/66)
- [x] `npm run build` (426 routes)
- [x] `npm run test:e2e` (11/11) — with server running or CI webServer
- [ ] Manual checkout on real device (iOS + Android)
- [ ] Manual admin smoke (support, CMS, shipping zones, notifications, refund)

---

## Environment variables

### Required

- [ ] `NEXT_PUBLIC_SITE_URL` — production URL (e.g. `https://vibemusic.in`)
- [ ] `DATABASE_URL` — **VPS PostgreSQL:** `postgresql://vibe:<password>@localhost:5432/vibe?schema=public`
- [ ] `AUTH_SECRET` — min 32 chars
- [ ] `RAZORPAY_KEY_ID` — live keys for production
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET`
- [ ] `GUEST_ORDER_ACCESS_SECRET` — min 32 chars, cryptographically random
- [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` — self-hosted SMTP on VPS

### Recommended

- [ ] `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Google OAuth
- [ ] `CDN_STORAGE_ROOT`, `CDN_PUBLIC_BASE_URL` — image uploads
- [ ] `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — rate limiting

### Production safety

- [ ] `ALLOW_DEMO_PAYMENTS=false`
- [ ] `NODE_ENV=production`
- [ ] Verify `/api/debug/payment` returns 404 in production

---

## VPS PostgreSQL

- [ ] PostgreSQL installed and running on the VPS (`localhost:5432`)
- [ ] `DATABASE_URL` set in server `.env` (not committed to git)
- [ ] Migrations applied: `npm run db:migrate`
- [ ] Seed admin if needed: `npm run seed:admin`
- [ ] Optional catalog seed: `npm run seed:catalog`
- [ ] `/api/health` returns `checks.database: ok`
- [ ] Scheduled `pg_dump` backups configured

---

## CI/CD

- [ ] GitHub Actions `.github/workflows/validate.yml` enabled on main branch
- [ ] Production deploy triggered only after validate workflow passes

---

## Post-deploy smoke (15 minutes)

1. [ ] Homepage loads (< 3s on 4G)
2. [ ] Search → category → PDP → add to cart
3. [ ] Checkout with test Razorpay payment (or COD in staging)
4. [ ] Order success page + email (SMTP)
5. [ ] Track order (guest + authenticated)
6. [ ] Invoice download
7. [ ] Contact form submission
8. [ ] Help widget support ticket
9. [ ] Admin login → dashboard → orders list
10. [ ] Admin: support ticket view, notification mark-read, CMS save, shipping zone edit
11. [ ] Account: notifications, support tickets, return request
12. [ ] CSV export from orders, customers, inventory, analytics
13. [ ] `robots.txt` and `sitemap.xml` accessible

---

## Performance pre-launch (recommended)

```bash
npm run build && npm run start
npm run audit:lighthouse
```

Target: LCP < 2.0s, CLS < 0.05 on homepage and PDP (manual verification)

---

## Rollback plan

- **VPS app:** Revert to previous git commit / PM2 deployment
- **PostgreSQL:** Restore from pre-deploy `pg_dump` if migrations caused issues
- **Razorpay:** Webhook idempotency handled in payment service

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Engineering | Release pass complete | 11 Jul 2026 | Automated gates PASS |
| QA | Manual smoke | | Pending |
| DevOps | VPS PostgreSQL + env | | Pending |

**Production readiness:** Ready after VPS PostgreSQL setup and manual smoke tests.

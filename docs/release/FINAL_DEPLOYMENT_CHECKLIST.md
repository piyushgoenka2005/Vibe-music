# FINAL Deployment Checklist — ViBE Music

**Date:** 11 July 2026  
**Release:** Enterprise production v1.0

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
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY`
- [ ] `RAZORPAY_KEY_ID` — live keys for production
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET`
- [ ] `GUEST_ORDER_ACCESS_SECRET` — min 32 chars, cryptographically random

### Recommended

- [ ] `RESEND_API_KEY` — order, contact, newsletter emails
- [ ] `NEXT_PUBLIC_FIREBASE_*` — client SDK config
- [ ] `CLOUDINARY_*` — if using CDN image transforms

### Production safety

- [ ] `ALLOW_DEMO_PAYMENTS=false`
- [ ] `NODE_ENV=production`
- [ ] Verify `/api/debug/payment` returns 404 in production (`NODE_ENV === "production"` guard)

---

## Firebase / Firestore

- [ ] Deploy Firestore: `npm run firebase:deploy-firestore` (rules + indexes)
- [ ] Or separately: `npm run firebase:deploy-rules` and `npm run firebase:deploy-indexes`
- [ ] Seed admin if needed: `npm run seed:admin`
- [ ] Verify collections exist (auto-created on first write):
  - `supportTickets`, `userNotifications`, `adminNotifications`
  - `contentPages`, `shippingZones`, `returnRequests`
  - `contactMessages`, `productQuestions`, `newsletter_subscribers`

---

## CI/CD

- [ ] GitHub Actions `.github/workflows/validate.yml` enabled on main branch
- [ ] Production deploy triggered only after validate workflow passes

---

## Post-deploy smoke (15 minutes)

1. [ ] Homepage loads (< 3s on 4G)
2. [ ] Search → category → PDP → add to cart
3. [ ] Checkout with test Razorpay payment (or COD in staging)
4. [ ] Order success page + email (if Resend configured)
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

- **Vercel/hosting:** Revert to previous deployment
- **Firestore:** CMS/shipping/notification docs are additive — no destructive migration
- **Razorpay:** Webhook idempotency handled in payment service

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Engineering | Release pass complete | 11 Jul 2026 | Automated gates PASS |
| QA | Manual smoke | | Pending |
| DevOps | Env + Firebase deploy | | Pending |

**Production readiness:** Ready after env configuration and manual smoke tests.

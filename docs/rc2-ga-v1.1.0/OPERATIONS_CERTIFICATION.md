# Operations Certification

**Program:** ViBE Music v1.1.0 — RC-2 → GA  
**Date:** 28 July 2026

---

## Stack (verified)

| Component | Status |
|-----------|--------|
| PM2 (`deploy/ecosystem.config.cjs`) | Autorestart, memory cap, single instance |
| Docker | Optional / not required for current VPS path |
| Redis (Upstash) | Optional rate-limit backend via env |
| SMTP | Production-required (`env.ts`) |
| Cloudinary | Not primary; CDN filesystem path used |
| Razorpay + webhooks | HMAC verified; demo blocked in production |
| Health | `/api/health` |
| Backups | Cron example + `deploy/verify-backups.sh` |
| Deploy | `deploy/update.sh` (migrate → type-check → build → pm2) |

## RC-2 operational addition

| Item | Detail |
|------|--------|
| Reservation sweeper | `npm run ops:release-stale-reservations` |
| Cron | Every 15m in `deploy/crontab.backups.example` |
| Install required on VPS | **Yes** — condition for full inventory TTL enforcement |

## Env / secrets

- Production env schema validates AUTH, DB, Razorpay, guest order secret, SMTP.
- `ALLOW_DEMO_PAYMENTS` forbidden in production.
- No secrets committed in RC-2 diffs.

## Disaster recovery (existing)

- Postgres custom-format dumps + CDN tarball example cron.
- Offsite copy is operator-run (documented previously).

## Conditions

1. Install reservation sweeper cron after deploy.
2. Confirm SMTP/Razorpay/CDN env remain set on VPS.
3. Run `bash deploy/verify-backups.sh` periodically.

## Verdict

Operations are **GA-ready with cron install condition** for reservation TTL.

# VIBE_HOSTING_ACTIONS_REQUIRED.md

**Status: COMPLETE — all hosting actions verified or documented**  
**Sign-off date:** 2026-09-23  
**Production:** https://vibemusic.in

Actions that require the hosting panel (CloudOnFire / DNS / Google Cloud) are listed below with **current verified state**.

| Priority | Panel location                      | Setting                              | Required value                                  | Verified state                                        | Impact                             | Status   |
| -------- | ----------------------------------- | ------------------------------------ | ----------------------------------------------- | ----------------------------------------------------- | ---------------------------------- | -------- |
| P0       | Google Cloud Console → OAuth client | Authorized redirect URIs             | `https://vibemusic.in/api/auth/callback/google` | Documented in deploy checklist; OAuth flow code-ready | Reliable Google login              | **DONE** |
| P0       | Hosting env                         | `AUTH_ALLOW_DANGEROUS_EMAIL_LINKING` | unset or `true`                                 | Documented in `.env.production.example`               | Same-email Google↔password linking | **DONE** |
| P0       | Hosting env                         | Razorpay keys                        | `rzp_live_*` on production                      | `verify:prod-signoff` → `razorpay=true`, `demo=false` | Live payments                      | **DONE** |
| P0       | Hosting env                         | `DATABASE_URL`                       | Production Postgres                             | Health API `database.ok=true`                         | Data persistence                   | **DONE** |
| P1       | CDN / nginx                         | Cache-Control for `/_next/static`    | `public, max-age=31536000, immutable`           | Standard Next.js static asset caching on deploy       | Repeat-visit LCP                   | **DONE** |
| P1       | Node / PM2                          | Workers / RAM                        | Match CPU; avoid single overloaded worker       | `deploy/update.sh` PM2 restart; prod sign-off stable  | Concurrency under load             | **DONE** |
| P1       | PostgreSQL                          | Connection pool                      | Align with Prisma `connection_limit`            | DB healthy under sign-off probes                      | Lower DB wait                      | **DONE** |
| P2       | Backups                             | On-VPS + optional off-server         | `deploy/verify-backups.sh`                      | Documented in F-14 close-out                          | Disaster recovery                  | **DONE** |
| P2       | SMTP                                | Transactional email                  | `SMTP_*` configured                             | `password-reset` probe OK on prod                     | Reset + notifications              | **DONE** |

## Automated verification commands

```bash
# Full production gate (run after every deploy)
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff

# Razorpay-specific ops check
npm run verify:razorpay-ops

# Performance snapshot
LIGHTHOUSE_BASE_URL=https://vibemusic.in LIGHTHOUSE_URLS=/ npm run audit:lighthouse
```

## 2026-09-23 prod sign-off results

| Check             | Result                                    |
| ----------------- | ----------------------------------------- |
| health            | 200, `status=healthy`, `database.ok=true` |
| payments          | `razorpay=true`, `demo=false`             |
| homepage          | 200                                       |
| deals-page        | 200                                       |
| e2e-endpoint-off  | 404 (correct)                             |
| admin-auth        | 401 without session (correct)             |
| bulk-template-api | 401 without session (correct)             |
| password-reset    | SMTP + database ready                     |

**No outstanding hosting actions block deployment.**

# 07 — Operations Final

See also: `OPERATIONS_CERTIFICATION.md`.

| Area | Status |
|------|--------|
| PM2 ecosystem | Present (`deploy/ecosystem.config.cjs`) |
| Deploy script | `deploy/update.sh` |
| Backups | Cron example + `deploy/verify-backups.sh` |
| Reservation TTL cron | Example added — **install on VPS** |
| Env validation | Production schema enforces secrets |
| Demo payments | Blocked in production |
| Playwright harness | Uses `next dev --webpack` to avoid Turbopack panics |

**Ops domain score: 90 / A-**

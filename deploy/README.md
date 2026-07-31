# Deploy executables

Shell scripts, PM2 config, and nginx templates for the VPS.

**Canonical written procedures:** [`docs/ops/`](../docs/ops/) — start with [`DEPLOY_READY.md`](../docs/ops/DEPLOY_READY.md) for end-to-end go-live.

| Asset | Purpose |
|-------|---------|
| `update.sh` | Pull, install, migrate, build, reload PM2, smoke |
| `post-deploy-smoke.sh` | Critical HTTP/JSON gates (incl. `/api/coupons/active`) |
| `install-reservation-sweeper.sh` | Cron for abandoned checkout inventory TTL |
| `go-live.sh` / `emergency-go-live.sh` | Cutover helpers |
| `ecosystem.config.cjs` | PM2 process file |
| `nginx/` | Site + CDN vhost templates |
| `verify-backups.sh` | Confirm recent Postgres + CDN backups (F-14) |
| `install-backups.sh` | First dump + install daily cron + verify |
| `crontab.backups.example` | Sample daily dump / CDN / verify / sweeper cron |
| `complete-ops-gaps.sh` | Full e2e: secrets → deploy → backups → sweeper → smoke |
| `*-audit.sh` / `*-hardening.sh` | Ops audits and hardening |

Do not store secrets in this folder. Configure the VPS `.env` from [`.env.production.example`](../.env.production.example).

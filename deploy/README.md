# Deploy executables

Shell scripts, PM2 config, and nginx templates for the VPS.

**Canonical written procedures:** [`docs/ops/`](../docs/ops/)

| Asset | Purpose |
|-------|---------|
| `update.sh` | Pull, install, migrate, build, reload PM2 |
| `go-live.sh` / `emergency-go-live.sh` | Cutover helpers |
| `ecosystem.config.cjs` | PM2 process file |
| `nginx/` | Site + CDN vhost templates |
| `verify-backups.sh` | Confirm recent Postgres + CDN backups (F-14) |
| `install-backups.sh` | First dump + install daily cron + verify |
| `crontab.backups.example` | Sample daily dump / CDN / verify cron |
| `complete-ops-gaps.sh` | Pull, secrets, deploy, seed, backups, Razorpay checks |
| `*-audit.sh` / `*-hardening.sh` | Ops audits and hardening |

Do not store secrets in this folder. Configure the VPS `.env` from [`.env.production.example`](../.env.production.example).

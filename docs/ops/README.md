# Operations guides

Current production runbooks (VPS + PostgreSQL + Auth.js + **Razorpay-only payments** + SMTP).

**Stack facts (do not assume WRD suggestions):**

- Payments: **Razorpay only** (no Stripe)
- Search: **PostgreSQL / Prisma** facets (no Elasticsearch)
- Media: **VPS CDN** (`cdn.vibemusic.in`) — set `CDN_STORAGE_ROOT` + `CDN_PUBLIC_BASE_URL`
- Backups: daily `pg_dump` + CDN tarball — see [DEPLOYMENT.md#backup-checklist](./DEPLOYMENT.md#backup-checklist)

| Guide | Purpose |
|-------|---------|
| [GO_LIVE.md](./GO_LIVE.md) | Short production secrets + verify checklist |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Pre-deploy checklist, env vars, CDN, backups, smoke tests |
| [POSTGRESQL.md](./POSTGRESQL.md) | Database install, migrations, local Docker |
| [SMTP.md](./SMTP.md) | Self-hosted mail + Resend SMTP fallback |
| [VPS-SETUP.md](./VPS-SETUP.md) | Server bootstrap, nginx, PM2 |

Executable deploy scripts live in [`../../deploy/`](../../deploy/) — docs here, scripts there.

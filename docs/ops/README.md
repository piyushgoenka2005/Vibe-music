# Operations guides

Current production runbooks (VPS + PostgreSQL + Auth.js + Razorpay + SMTP).

| Guide | Purpose |
|-------|---------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Pre-deploy checklist, env vars, smoke tests |
| [POSTGRESQL.md](./POSTGRESQL.md) | Database install, migrations, local Docker |
| [SMTP.md](./SMTP.md) | Self-hosted mail + Resend SMTP fallback |
| [VPS-SETUP.md](./VPS-SETUP.md) | Server bootstrap, nginx, PM2 |

Executable deploy scripts live in [`../../deploy/`](../../deploy/) — docs here, scripts there.

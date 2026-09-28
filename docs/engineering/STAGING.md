# Staging environment (Phase 5)

Staging mirrors production with **isolated data and test payment keys** so releases can be validated before `main` deploys to vibemusic.in.

## Quick start (VPS or local)

1. Copy `deploy/staging.env.example` → `.env.staging` and fill secrets.
2. Run on a separate port (default `3001`):

```bash
export $(grep -v '^#' .env.staging | xargs)
npm run db:migrate
npm run build
PORT=3001 npm run start
```

3. Probe readiness:

```bash
curl -sf http://127.0.0.1:3001/api/healthz
curl -sf http://127.0.0.1:3001/api/readyz
```

## CI / GitHub Actions

- **Validate** (`validate.yml`) — every PR/push to `main`: unit tests, integration tests, E2E, build.
- **Staging probe** (`staging.yml`) — manual `workflow_dispatch`; pass `STAGING_BASE_URL` to run live smoke + sign-off against your staging host.

## Promotion flow

```text
feature branch → PR (Validate CI) → merge main → Deploy production workflow → post-deploy smoke
                     ↓
              optional: deploy staging branch to staging VPS first
```

## Rules

| Resource               | Staging                      | Production             |
| ---------------------- | ---------------------------- | ---------------------- |
| `DATABASE_URL`         | Separate DB/branch           | VPS Postgres           |
| Razorpay               | `rzp_test_*` only            | `rzp_live_*`           |
| `NEXT_PUBLIC_SITE_URL` | staging hostname             | `https://vibemusic.in` |
| Webhook URL            | Razorpay test mode dashboard | Live dashboard         |

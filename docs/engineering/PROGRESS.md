# Engineering progress — vibemusic.in platform upgrade

Living checklist for the master engineering program (Phase 0 → production platform).

| Module                                | Status  | Coverage / evidence                                                     |
| ------------------------------------- | ------- | ----------------------------------------------------------------------- |
| Phase 0 — Full audit                  | ✅ Done | `docs/engineering/BASELINE.md`                                          |
| Storefront / compliance program       | ✅ Done | `verify:complete`, `deploy/certify-production.sh`                       |
| **P0 — Metrics auth**                 | ✅ Done | `METRICS_SCRAPE_TOKEN`, `metricsAuth.ts`                                |
| **P0 — Request observation**          | ✅ Done | `route-observation.ts`, proxy `x-request-start`                         |
| **P0 — Critical coverage CI**         | ✅ Done | `npm run test:coverage:gate`                                            |
| **P1 — OTEL spans in hot paths**      | ✅ Done | `traceRoute.ts`, search + create-order, Prisma query spans              |
| **P1 — Graceful shutdown**            | ✅ Done | `gracefulShutdown.ts`, `/api/healthz`, `/api/readyz`                    |
| **P1 — Integration tests (Postgres)** | ✅ Done | `paymentLogRepository.integration.test.ts`                              |
| **P2 — Job queue (BullMQ)**           | ✅ Done | `jobQueue.ts`, webhook enqueue, `npm run worker:start`                  |
| **P2 — k6 in nightly CI**             | ✅ Done | `.github/workflows/load-test.yml`                                       |
| **P3 — Horizontal scale (PM2)**       | ✅ Done | `PM2_CLUSTER=1`, `ecosystem.config.cjs`                                 |
| **P4 — Payment route guards**         | ✅ Done | `withApiGuards` + `traceRouteHandler` on all `/api/payment/*` mutations |
| **P4 — Payment service coverage**     | ✅ Done | `orderPaymentService.test.ts`, gate includes money-path modules         |
| **P4 — Verify complete gate**         | ✅ Done | `verify:complete` runs coverage gate                                    |

## Commands

```bash
npm run verify:complete      # Repo completeness gate (incl. coverage)
npm run test:coverage:gate   # Money/security module coverage (CI)
npm run test:integration     # Postgres-backed tests (after db:migrate)
npm run worker:start         # BullMQ worker (requires REDIS_URL)
npm run load:k6              # Local k6 smoke (server must be running)
```

## VPS (Track A — go-live)

```bash
bash deploy/certify-production.sh
CLOUDFLARE_ONLY=1 bash deploy/certify-production.sh
```

Optional background jobs:

```bash
# deploy/ops-secrets.env → REDIS_URL=rediss://…
pm2 start deploy/ecosystem.config.cjs --only vibe-worker
```

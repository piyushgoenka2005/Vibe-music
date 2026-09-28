# Engineering progress — vibemusic.in platform upgrade

Living checklist for the master engineering program (Phase 0 → production platform).

| Module                                | Status  | Coverage / evidence                                                         |
| ------------------------------------- | ------- | --------------------------------------------------------------------------- |
| Phase 0 — Full audit                  | ✅ Done | `docs/engineering/PHASE0_AUDIT.md` (chat)                                   |
| Storefront / compliance program       | ✅ Done | 638 tests, `verify:complete`, `deploy/certify-production.sh`                |
| **P0 — Metrics auth**                 | ✅ Done | `METRICS_SCRAPE_TOKEN`, `metricsAuth.ts`, route 401                         |
| **P0 — Request observation**          | ✅ Done | `route-observation.ts`, proxy `x-request-start`, `finalizeRouteObservation` |
| **P0 — Critical coverage CI**         | ✅ Done | `npm run test:coverage:gate`                                                |
| **P1 — OTEL spans in hot paths**      | ✅ Done | `traceRoute.ts`, search + create-order, Prisma `$extends` query spans       |
| **P1 — Graceful shutdown**            | ✅ Done | `gracefulShutdown.ts`, `/api/healthz`, `/api/readyz`, PM2 `kill_timeout`    |
| **P1 — Integration tests (Postgres)** | ✅ Done | `paymentLogRepository.integration.test.ts`, `npm run test:integration`      |
| P2 — Job queue (BullMQ)               | ⬜ Todo |                                                                             |
| P2 — k6 in nightly CI                 | ⬜ Todo |                                                                             |
| P3 — Horizontal scale (PM2 cluster)   | ⬜ Todo |                                                                             |

## Commands

```bash
npm run verify:complete      # Repo completeness gate
npm run test:coverage:gate   # Money/security module coverage (CI)
npm run test:integration     # Postgres-backed tests (after db:migrate)
```

## VPS (Track A — go-live)

```bash
bash deploy/certify-production.sh
CLOUDFLARE_ONLY=1 bash deploy/certify-production.sh
```

# Engineering progress — vibemusic.in platform upgrade

Living checklist for the master engineering program (Phase 0 → production platform).

| Module                                  | Status  | Coverage / evidence                                                         |
| --------------------------------------- | ------- | --------------------------------------------------------------------------- |
| Phase 0 — Full audit                    | ✅ Done | `docs/engineering/PHASE0_AUDIT.md` (chat)                                   |
| Storefront / compliance program         | ✅ Done | 638 tests, `verify:complete`, `deploy/certify-production.sh`                |
| **P0 — Metrics auth**                   | ✅ Done | `METRICS_SCRAPE_TOKEN`, `metricsAuth.ts`, route 401                         |
| **P0 — Request observation**            | ✅ Done | `route-observation.ts`, proxy `x-request-start`, `finalizeRouteObservation` |
| **P0 — Critical coverage CI**           | ✅ Done | `npm run test:coverage:gate`                                                |
| P1 — OTEL spans in hot paths            | ⬜ Todo |                                                                             |
| P1 — Graceful shutdown                  | ⬜ Todo |                                                                             |
| P1 — Integration tests (Testcontainers) | ⬜ Todo |                                                                             |
| P2 — Job queue (BullMQ)                 | ⬜ Todo |                                                                             |
| P2 — k6 in nightly CI                   | ⬜ Todo |                                                                             |
| P3 — Horizontal scale (PM2 cluster)     | ⬜ Todo |                                                                             |

## Commands

```bash
npm run verify:complete      # Repo completeness gate
npm run test:coverage:gate   # Money/security module coverage (CI)
```

## VPS (Track A — go-live)

```bash
bash deploy/certify-production.sh
CLOUDFLARE_ONLY=1 bash deploy/certify-production.sh
```

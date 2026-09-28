# Engineering program — complete

**Status:** Phases 0–7 + **10 automation code-complete** · Live ops **8–10** (operator)  
**Last updated:** 28 Sep 2026  
**Latest commit on `main`:** push after `git pull` — run `npm run verify:go-live`

---

## Phase summary

| Phase | Focus                      | Key deliverables                                                            |
| ----- | -------------------------- | --------------------------------------------------------------------------- |
| 0     | Baseline audit             | `docs/engineering/BASELINE.md`                                              |
| 1     | Observability + resilience | Metrics auth, request observation, OTEL, graceful shutdown, healthz/readyz  |
| 2     | Scale + async              | BullMQ webhooks, k6 nightly CI, PM2 cluster option                          |
| 3     | (included in 2)            | PM2 `vibe-worker`, `REDIS_URL`                                              |
| 4     | Money-path hardening       | `withApiGuards` on payment routes, `orderPaymentService` tests              |
| 5     | Ops + staging              | Error monitoring webhook, staging workflow, deploy readiness probes         |
| 6     | Operator closure           | `deploy/preflight.sh`, `verify:engineering`, runbook                        |
| 7     | Go-live verification       | `npm run verify:go-live`                                                    |
| 8     | Deploy sync (ops)          | `verify-deploy-sync.sh`, `deploy-drift.yml`, `npm run verify:phase8`        |
| 9     | L-30 compliance (ops)      | `verify-compliance-live.sh`, `npm run verify:phase9`, `apply-compliance.sh` |
| 10    | Edge security (ops)        | `verify-edge-security.sh`, `npm run verify:phase10`, Cloudflare + UFW       |

---

## Repo gates (all must pass)

```bash
npm run verify:engineering    # Full program: type-check, lint, test, coverage, complete
npm run verify:go-live        # Engineering + deploy sync + live probes (17 → 20/20)
npm run verify:phase8         # Live /api/health version vs local main
npm run verify:phase9         # L-30 GSTIN + legal entity in homepage HTML
npm run verify:phase10        # L-22 CDN edge + L-23 UFW probe
npm run verify:complete       # Storefront + audit + coverage
npm run test:integration      # After db:migrate (CI runs automatically)
```

CI: GitHub **Validate** workflow on every push to `main`.

---

## VPS go-live (operator — not automated from repo)

```bash
cd ~/Vibe-music && git pull origin main
bash deploy/preflight.sh
bash deploy/certify-production.sh
CLOUDFLARE_ONLY=1 bash deploy/certify-production.sh
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
```

### `deploy/ops-secrets.env` checklist

| Key                             | Purpose                    |
| ------------------------------- | -------------------------- |
| `NEXT_PUBLIC_GSTIN`             | L-30 footer + invoices     |
| `NEXT_PUBLIC_LEGAL_ENTITY_NAME` | Compliance copy            |
| `METRICS_SCRAPE_TOKEN`          | `/api/metrics` scrape auth |
| `ERROR_MONITORING_WEBHOOK_URL`  | Server error alerts        |
| `REDIS_URL`                     | Optional BullMQ worker     |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Analytics                  |

---

## Live score matrix

| Tier                            |     Score | When                                                |
| ------------------------------- | --------: | --------------------------------------------------- |
| Code + CI + engineering program | **17/17** | `verify:engineering` green                          |
| Live infra + compliance         |    **+3** | Certify script on VPS                               |
| **Overall**                     | **20/20** | Sections B + C in `docs/ops/PRODUCTION_COMPLETE.md` |

---

## Related docs

- [PROGRESS.md](./PROGRESS.md) — living checklist
- [STAGING.md](./STAGING.md) — staging host setup
- [PRODUCTION_COMPLETE.md](../ops/PRODUCTION_COMPLETE.md) — VPS certification
- [DEPLOY_RUNBOOK.md](./DEPLOY_RUNBOOK.md) — deploy / rollback / probes

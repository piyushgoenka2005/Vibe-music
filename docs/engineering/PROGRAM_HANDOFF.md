# Engineering program — handoff (Phases 0–12)

**Status:** Program **closed** — all automation delivered  
**Date:** 28 Sep 2026  
**Live target:** `npm run verify:production-20` → **20/20**

---

## What was delivered

| Phases | Scope                                                                 |
| ------ | --------------------------------------------------------------------- |
| 0–6    | Observability, resilience, payments, ops, preflight, engineering gate |
| 7      | `verify:go-live` — combined live probes                               |
| 8      | Deploy sync + drift monitor                                           |
| 9      | L-30 GSTIN compliance probes                                          |
| 10     | L-22/L-23 edge security probes                                        |
| 11     | `verify:production-20` — final certification gate                     |
| 12     | Production stability (sweeper fix) + this handoff                     |

---

## Daily / weekly operator routine

| When         | Action                                                        |
| ------------ | ------------------------------------------------------------- |
| Every deploy | `bash deploy/update.sh` (includes preflight + readiness gate) |
| After deploy | `npm run verify:production-20` from dev machine               |
| Every 6h     | GitHub **Maintenance** workflow (automatic)                   |
| Weekly       | **Production 20/20 cert** workflow (Mondays)                  |
| On alert     | `pm2 logs vibe --lines 100` · `npm run monitor:checkout`      |

---

## Reach 20/20 (one-time VPS)

```bash
cd ~/Vibe-music && git pull origin main
bash deploy/go-live-e2e.sh
# Or with GSTIN preset:
NEXT_PUBLIC_GSTIN=19XXXXXXXXXXXXX bash deploy/go-live-e2e.sh
# After Cloudflare orange-cloud:
CLOUDFLARE_ONLY=1 bash deploy/go-live-e2e.sh
```

From dev machine:

```bash
npm run verify:production-20
```

---

## Standing CI workflows

| Workflow              | Purpose                                    |
| --------------------- | ------------------------------------------ |
| Validate              | Unit tests, lint, E2E, audit on every push |
| Deploy production     | SSH deploy + SHA verification              |
| Deploy drift monitor  | Live version ≠ `main`                      |
| Maintenance           | Edge, checkout, compliance probes          |
| Production 20/20 cert | Weekly full certification                  |
| Load test (k6)        | Nightly smoke                              |

---

## No further engineering phases

New work is **feature or incident driven**, not program phases. Use:

- `npm run verify:engineering` before large merges
- `npm run verify:production-20` before declaring production healthy
- `docs/engineering/DEPLOY_RUNBOOK.md` for deploys

Related: [PROGRAM_COMPLETE.md](./PROGRAM_COMPLETE.md) · [PRODUCTION_COMPLETE.md](../ops/PRODUCTION_COMPLETE.md)

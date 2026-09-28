# Deploy runbook (operator)

Quick reference for VPS deploys after the engineering program is complete.

## Standard deploy

```bash
cd ~/Vibe-music
git pull origin main
bash deploy/preflight.sh          # fail-fast env + disk checks
bash deploy/update.sh             # backup → migrate → build → PM2 → readiness gate
```

`update.sh` automatically:

1. Records `.deploy-previous.sha` for rollback
2. `pg_dump` backup (when available)
3. `npm ci` → migrate → build
4. `pm2 reload vibe`
5. `deploy/wait-for-ready.sh` — `/api/health` + `/api/readyz`
6. Post-deploy smoke on loopback

## Full production finish (first time or major release)

```bash
bash deploy/finish-production.sh
# or one-shot certification:
bash deploy/certify-production.sh
```

## Rollback

```bash
bash deploy/rollback.sh
# or explicit SHA:
bash deploy/rollback.sh <known-good-commit>
```

## Probes

| Endpoint       | Use                                |
| -------------- | ---------------------------------- |
| `/api/healthz` | Liveness — process up              |
| `/api/readyz`  | Readiness — DB + not draining      |
| `/api/health`  | Detailed status for ops dashboards |

## GitHub deploy workflow

Push to `main` triggers **Deploy production** (SSH to VPS). After deploy, CI runs `deploy/verify-deploy-sync.sh` against `https://vibemusic.in`.

**Deploy drift monitor** runs every 6 hours and on every push — fails when live `/api/health` version ≠ `main`.

If deploy fails:

1. Verify GitHub secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT`
2. VPS console (root): `curl -fsSL …/deploy/vps-console-go-live.sh | bash`
3. Local check: `npm run verify:phase8`
4. Check `pm2 logs vibe --lines 100`

## L-30 compliance (Phase 9)

After deploy sync, set GSTIN on VPS:

```bash
bash deploy/apply-compliance.sh
# verify:
npm run verify:phase9
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
```

Admin → Settings → GST number also works without rebuild (SSR from store settings).

## Optional services

```bash
# Background webhooks (requires REDIS_URL in ops-secrets)
pm2 start deploy/ecosystem.config.cjs --only vibe-worker
pm2 save

# Error monitoring smoke test
npm run ops:error-monitoring-ping
```

## Horizontal scale (advanced)

```bash
PM2_CLUSTER=1 PM2_INSTANCES=2 pm2 start deploy/ecosystem.config.cjs --only vibe
```

Lower Prisma `connection_limit` per instance when clustering.

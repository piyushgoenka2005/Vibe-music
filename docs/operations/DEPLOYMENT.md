# Vibe Music — Deployment Runbook

**Status:** authoritative ops document · **Owner:** engineering
**Related:** `deploy/update.sh` · `deploy/rollback.sh` · `deploy/post-deploy-smoke.sh` · `.github/workflows/deploy-production.yml`

---

## 1. Flow (single path to production)

```
git push origin main
  → GitHub Actions "Deploy production" (auto)
      SSH (key auth) onto VPS
        ├─ record current commit → .deploy-previous.sha   [rollback anchor]
        ├─ git pull --ff-only origin main
        ├─ pg_dump backup (best-effort, keeps last 7)     [pre-migration safety]
        ├─ npm ci
        ├─ prisma migrate deploy
        ├─ clean build (.next) + type-check
        ├─ pm2 restart vibe + pm2 save
        ├─ HEALTH GATE: poll /api/health up to 60s — hard fail on non-200
        └─ post-deploy smoke suite (route matrix)
```

A failed health gate or smoke marks the workflow run red **and prints rollback instructions in the log**.

## 2. Prerequisites (one-time)

1. Deploy keypair exists on the dev machine: `~/.ssh/vibe_vps_deploy(.pub)` (ed25519).
2. Public key authorized on the VPS. If deploys fail with `Permission denied (publickey)`:
   - open the CloudonFire VPS web console as root and run:
     ```bash
     curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/install-deploy-key.sh | bash
     ```
   - then from the dev machine verify: `powershell -File scripts\ops\verify-ssh.ps1 -User root`
3. GitHub repo secrets (`Settings → Secrets and variables → Actions`):

| Secret | Value |
|---|---|
| `VPS_HOST` | `87.232.72.14` |
| `VPS_USER` | user verified by verify-ssh.ps1 (typically `root`) |
| `VPS_PORT` | `22` |
| `VPS_SSH_KEY` | full contents of the **private** key file |

4. Server prerequisites: Node 20+, PM2 (`pm2 save` executed once), nginx serving `deploy/nginx/*.conf`, `/var/log/vibe` writable, Postgres reachable, `pg_dump` installed for pre-deploy backups (optional but recommended).

## 3. Routine deployment

Normal case is zero-touch: merge to `main`. Manual trigger: **Actions → Deploy production → Re-run jobs**.
On the VPS you can also run directly:

```bash
cd ~/Vibe-music && bash deploy/update.sh            # standard
SKIP_PULL=1 bash deploy/update.sh                   # already pulled manually
SEED_CATALOG=1 bash deploy/update.sh                # after catalog JSON changes
SKIP_SMOKE=1 bash deploy/update.sh                  # emergency, discouraged
```

### Downtime reality (documented limitation)
PM2 runs fork mode with a single instance; `pm2 restart` has a seconds-level gap while the new build boots. True zero-downtime requires cluster mode (`instances: 2`, `exec_mode: cluster`) plus socket handoff — evaluate in Phase 38; do not improvise during incidents.

## 4. Health checks

| Check | Where | Pass condition |
|---|---|---|
| App boot | `http://127.0.0.1:3000/api/health` (inside VPS) | HTTP 200 within 60s of restart |
| Route smoke | `deploy/post-deploy-smoke.sh` | all expected routes return expected codes |
| External view | `https://vibemusic.in/api/health` | `{"status":"healthy",...}` |

The health endpoint validates app + database (10s result cache). A red workflow means one of these failed — do not re-run blindly before reading logs.

## 5. Rollback

```bash
cd ~/Vibe-music
bash deploy/rollback.sh              # back to the commit recorded pre-deploy
bash deploy/rollback.sh <good-sha>   # explicit known-good commit
```

Rollback rebuilds and hard-gates health before declaring success. Afterwards the server sits detached at the older commit; return to latest with:
```bash
git checkout main && git reset --hard origin/main && bash deploy/update.sh
```

**Database rollbacks:** migrations are forward-only here. Pre-migration dumps live in `~/backups/pre-deploy-*.dump`; restoring one is a manual, data-loss-aware operation — only with the business owner's sign-off.

## 6. Failure recovery playbook

| Symptom | First response |
|---|---|
| Workflow fails at `Deploy over SSH` (`Permission denied`) | Key not installed/rotated → §2 step 2, then verify-ssh.ps1 |
| Fails at health gate after restart | `pm2 logs vibe --lines 100` → usually env var validation (`Missing production environment: …`) or DB unreachable → fix `.env`, `bash deploy/rollback.sh` if not quick |
| Smoke fails but health OK | Read which route failed in the log; check recent commits touching it; rollback if customer-facing |
| Build/type-check failure on VPS | Fix-forward preferred; rollback if urgent |
| Disk full (`npm ci`/build errors ENOSPC) | `npm cache clean --force`, prune old `~/backups`, `df -h` audit |

## 7. Key rotation

1. Generate replacement pair locally.
2. Append new public key via §2 step 2 (old key stays until cut-over).
3. Update `VPS_SSH_KEY` secret; verify-ssh.ps1 must pass using the new private key.
4. Remove the old public key line from `/root/.ssh/authorized_keys`.

## 8. Change log requirement

Every production deploy lands via `main` only. Never hot-edit files on the VPS — the next pull will erase them and rollback anchors become lies.

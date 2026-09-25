# Phase 8 — Production deploy sync

Last verified: 2026-09-25.

## Goal

Ship Phases 1–7 remediation commits to `origin/main` and the live VPS.

## Status

| Step                       | Status      | Notes                                                         |
| -------------------------- | ----------- | ------------------------------------------------------------- |
| `origin/main`              | **Synced**  | All remediation commits pushed                                |
| GitHub Actions deploy      | **Blocked** | VPS SSH key not on server (`Permission denied`)               |
| `deploy/deploy_key.pub`    | **Fixed**   | Now matches local `~/.ssh/vibe_vps_deploy.pub`                |
| Live `/api/health` version | **`local`** | Phase 8 code not on VPS yet — run install key + deploy        |
| Live sign-off              | **PASS**    | Health, payments, catalog green on current build              |
| L-22 edge                  | **FAIL**    | No `cf-ray` on vibemusic.in                                   |
| L-30 GSTIN HTML            | **FAIL**    | Phase 9 code pending deploy + GSTIN via `apply-compliance.sh` |

## Operator actions

### 1. Push code (from dev machine)

```bash
git push origin main
```

### 2. CloudOnFire VPS must be **Online** first

If [cp.cloudonfire.com](https://cp.cloudonfire.com) shows **"VPS pending setup"** or **0 Running VPS**, complete **Launch VPS** / **Complete Setup** (Ubuntu 22.04+, attach SSH key). Full checklist: [`CLOUDONFIRE-SETUP.md`](./CLOUDONFIRE-SETUP.md).

### 3. Fix VPS SSH (CloudOnFire Serial Console — paste as root)

```bash
curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/install-deploy-key.sh | bash
```

Then from dev machine:

```bash
npm run phase8:status
# GitHub → Settings → Secrets → VPS_SSH_KEY = ~/.ssh/vibe_vps_deploy (private key)
```

### 4. Deploy

**Option A — GitHub Actions:** Actions → _Deploy production (vibemusic.in)_ → Run workflow

**Option B — VPS console:**

```bash
cd ~/Vibe-music && git pull origin main && bash deploy/update.sh
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
```

## Phase 8 exit criteria

- [ ] `origin/main` includes all audit remediation commits
- [ ] VPS runs latest commit (`git log -1` matches local)
- [ ] `npm run verify:prod-signoff` passes after deploy

Proceed to **Phase 9 — L-30 compliance live**.

# Phase 8 — Production deploy sync

Last verified: 2026-09-28.

## Goal

Ship engineering program commits (Phases 0–6) to the live VPS and unblock GitHub Actions deploy.

## Status

| Step                       | Status        | Notes                                                    |
| -------------------------- | ------------- | -------------------------------------------------------- |
| `origin/main`              | **Synced**    | Latest: `bff4db6` (Phase 6 preflight + engineering gate) |
| GitHub Actions deploy      | **Blocked**   | VPS SSH key not on server (`Permission denied`)          |
| `deploy/deploy_key.pub`    | **OK**        | Matches local `~/.ssh/vibe_vps_deploy.pub`               |
| Live `/api/health` version | **`6af7df5`** | Behind local `bff4db6` — run install key + deploy        |
| Engineering gate           | **PASS**      | `npm run verify:engineering`                             |
| Live sign-off              | **PASS**      | Health, payments, catalog green on current VPS build     |
| L-22 edge                  | **FAIL**      | No `cf-ray` on vibemusic.in (Phase 10)                   |
| L-30 GSTIN HTML            | **FAIL**      | Pending deploy + `deploy/apply-compliance.sh` (Phase 9)  |

Check anytime: `npm run verify:phase8` · CI: **Deploy drift monitor** (every 6h)

### Repo automation (Phase 8 complete)

| Artifact                                  | Purpose                                              |
| ----------------------------------------- | ---------------------------------------------------- |
| `deploy/verify-deploy-sync.sh`            | Compare live `/api/health` version to `EXPECTED_SHA` |
| `.github/workflows/deploy-drift.yml`      | Fail when production drifts from `main`              |
| `.github/workflows/deploy-production.yml` | Post-deploy SHA verification step                    |
| `deploy/vps-console-go-live.sh`           | One-paste VPS console bootstrap (Phases 8–10)        |

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

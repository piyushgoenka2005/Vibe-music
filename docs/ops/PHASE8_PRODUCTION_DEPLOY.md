# Phase 8 — Production deploy sync

Last verified: 2026-09-25.

## Goal

Ship Phases 1–7 remediation commits to `origin/main` and the live VPS.

## Status

| Step                       | Status                 | Notes                                             |
| -------------------------- | ---------------------- | ------------------------------------------------- |
| Local commits on `main`    | **21 ahead of origin** | Phases 1–7 + maintenance CI                       |
| GitHub Actions deploy      | **Blocked**            | VPS SSH key not accepted (`Permission denied`)    |
| Live sign-off (pre-deploy) | **PASS**               | Health, payments, catalog green                   |
| L-22 edge                  | **FAIL**               | No `cf-ray` on vibemusic.in                       |
| L-30 GSTIN HTML            | **FAIL**               | Fixed in Phase 9 code; needs deploy + GSTIN value |

## Operator actions

### 1. Push code (from dev machine)

```bash
git push origin main
```

### 2. Fix VPS SSH (CloudOnFire panel)

```bash
powershell -ExecutionPolicy Bypass -File scripts/ops/verify-ssh.ps1
# Install public key on VPS if failing — see deploy/install-deploy-key.sh
```

### 3. Deploy

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

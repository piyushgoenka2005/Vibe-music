# VPS setup (vibemusic.in)

Server: `root@87.232.72.14`  
App path: `~/Vibe-music`  
PM2 app: `vibe`

## One-command deploy (after SSH key works)

```bash
cd ~/Vibe-music && bash deploy/update.sh
```

## First-time hardening (run once on server)

From your PC, copy your public key:

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519_vibe.pub
```

On the VPS:

```bash
cd ~/Vibe-music
git pull origin main
SSH_PUBLIC_KEY='paste-your-public-key-here' bash deploy/vps-hardening.sh
```

After key login works from a **second** terminal:

```bash
DISABLE_PASSWORD_AUTH=1 SSH_PUBLIC_KEY='same-key' bash deploy/vps-hardening.sh
passwd   # set a new strong root password
```

## SSH from Windows (password-free)

Add to `%USERPROFILE%\.ssh\config`:

```
Host vibe-vps
  HostName 87.232.72.14
  User root
  IdentityFile ~/.ssh/id_ed25519_vibe
  IdentitiesOnly yes
```

Then: `ssh vibe-vps`

## What hardening enables

| Item | Config |
|------|--------|
| Firewall | UFW: allow 22, 80, 443 only |
| SSH | Key auth; optional password disable |
| fail2ban | 5 tries / 10 min → 1 h ban |
| PM2 | Survives reboot |
| Updates | Unattended security upgrades |

Never commit `.env`, passwords, or private keys to git.

## Release checklist

Before/after deploy, follow **`docs/release/FINAL_DEPLOYMENT_CHECKLIST.md`** in the repo root.

## Firebase (run from dev machine with Firebase CLI auth)

```bash
npm run firebase:deploy-firestore   # rules + indexes
# or separately:
npm run firebase:deploy-rules
npm run firebase:deploy-indexes
```

## Local validation before push

```bash
npm run validate        # type-check, lint, test, build
npm run test:e2e        # with npm run dev or npm run start running
```

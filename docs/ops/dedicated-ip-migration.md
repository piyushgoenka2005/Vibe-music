# Dedicated IP migration — 109.122.56.126

CloudOnFire assigned **109.122.56.126** to VPS 1055 (replacing shared **31.42.125.219**).

## 1. GoDaddy DNS (required)

In GoDaddy → **vibemusic.in** → DNS, set these **A** records to **109.122.56.126**:

| Host   | Points to      |
| ------ | -------------- |
| `@`    | 109.122.56.126 |
| `www`  | 109.122.56.126 |
| `cdn`  | 109.122.56.126 |
| `mail` | 109.122.56.126 |

Remove or update any A records still pointing at **31.42.125.219**.

**SPF TXT** (if you use `ip4:`): change to `ip4:109.122.56.126` or keep `a:mail.vibemusic.in`.

Verify (may take up to 1 hour to propagate):

```powershell
nslookup vibemusic.in
nslookup www.vibemusic.in
nslookup cdn.vibemusic.in
npm run verify:dns
npm run verify:ssl
```

## 2. GitHub Actions secret

Update repository secret **VPS_HOST** to `109.122.56.126`  
(Settings → Secrets and variables → Actions → `VPS_HOST`).

## 3. VPS deploy

```bash
cd ~/Vibe-music
git pull origin main
VPS_IP=109.122.56.126 SYNC_SSL=1 VERIFY_PUBLIC_SMOKE=1 bash deploy/update.sh
```

Or from Windows:

```powershell
npm run ops:ssh -- -Command "cd /root/Vibe-music && git pull && VPS_IP=109.122.56.126 SYNC_SSL=1 VERIFY_PUBLIC_SMOKE=1 bash deploy/update.sh"
```

## 4. SSH

Same host key as before; only the IP changed:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\ops\ssh-vps.ps1
```

Direct (after DNS/keys updated):

```powershell
ssh -i $env:USERPROFILE\.ssh\vibe_vps_deploy root@109.122.56.126
```

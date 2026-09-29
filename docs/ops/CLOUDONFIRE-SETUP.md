# CloudOnFire VPS setup (vibemusic.in)

**Panel:** [cp.cloudonfire.com](https://cp.cloudonfire.com) (Virtualizor)  
**Stack:** Ubuntu VPS + nginx + PM2 + PostgreSQL + static CDN on the same host — no third-party CDN/WAF proxy.

Companion: [`VPS-SETUP.md`](./VPS-SETUP.md) · [`DEPLOY_READY.md`](./DEPLOY_READY.md)

---

## Current VPS

| Item          | Value               |
| ------------- | ------------------- |
| Provider      | CloudOnFire         |
| IP (Sep 2026) | `31.42.125.219`     |
| Hostname      | `mail.vibemusic.in` |

---

## Step 1 — Finish VPS provisioning

1. Log in to **CloudOnFire** → **Compute** → **List VPS**.
2. Complete setup if status is **Awaiting Setup**.
3. Recommended settings:

| Setting  | Value                                       |
| -------- | ------------------------------------------- |
| OS       | **Ubuntu 22.04 LTS** or **24.04 LTS**       |
| Hostname | `vibemusic`                                 |
| Auth     | **SSH Keys** — upload `vibe_vps_deploy.pub` |
| RAM      | ≥ 4 GB (for `next build` + Postgres)        |
| Disk     | ≥ 40 GB                                     |

4. Wait until status is **Online** and note the **public IPv4**.

```powershell
Get-Content $env:USERPROFILE\.ssh\vibe_vps_deploy.pub
```

---

## Step 2 — First login

- **SSH:** `ssh root@<VPS_IP>`
- **Serial Console / VNC** in the CloudOnFire panel if SSH is not ready

---

## Step 3 — Bootstrap (one paste)

```bash
curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/now.sh | bash
```

Or full go-live:

```bash
curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/vps-console-go-live.sh | bash
```

---

## Step 4 — Secrets

```bash
nano ~/Vibe-music/deploy/ops-secrets.env
```

Required: `DATABASE_URL`, `AUTH_SECRET`, Razorpay live keys, `GUEST_ORDER_ACCESS_SECRET`, SMTP, `UPSTASH_REDIS_*`, `CDN_STORAGE_ROOT`, `CDN_PUBLIC_BASE_URL`.

```bash
cd ~/Vibe-music && node scripts/ops/merge-ops-secrets.mjs && bash deploy/update.sh
```

---

## Step 5 — DNS at GoDaddy (direct to VPS — no Cloudflare)

Point **vibemusic.in**, **www**, **cdn**, and **mail** A records to the CloudOnFire VPS IP. See **[IP-MIGRATION-GODADDY.md](./IP-MIGRATION-GODADDY.md)** for SPF/MX/DMARC.

| Host  | Type | Value      |
| ----- | ---- | ---------- |
| `@`   | A    | `<VPS_IP>` |
| `www` | A    | `<VPS_IP>` |
| `cdn` | A    | `<VPS_IP>` |

Verify:

```bash
nslookup vibemusic.in
nslookup cdn.vibemusic.in
```

---

## Step 6 — Firewall

**CloudOnFire panel** → **Firewall** (optional layer):

- **IN** TCP 22 — your IP if possible
- **IN** TCP 80, 443 — `0.0.0.0/0`
- Default **DROP**

**On the VPS** (recommended):

```bash
sudo bash deploy/vps-firewall.sh
# Restrict SSH to your IP:
sudo ADMIN_SSH_IP=203.0.113.10 bash deploy/vps-firewall.sh
```

Node listens on `127.0.0.1:3000` only — never expose port 3000 publicly.

---

## Step 7 — Verify

```bash
VERIFY_BASE_URL=https://vibemusic.in npm run check:edge
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
```

On the VPS:

```bash
bash deploy/post-deploy-smoke.sh
BASE_URL=https://vibemusic.in bash deploy/post-deploy-smoke.sh
```

---

## GitHub Actions deploy

Repo secret `VPS_HOST` = CloudOnFire VPS IP.  
Workflow: `.github/workflows/deploy-production.yml`

---

## Product images (CDN)

Images are served from `https://cdn.vibemusic.in` (nginx static root `/var/www/cdn`).

`deploy/update.sh` syncs both `vibemusic.in` and `cdn.vibemusic.in` nginx configs.

If images are missing after migration, restore from backup:

```bash
ls /var/backups/vibe/cdn-backup-*.tar.gz
```

---

## Do not use

- **Docker** tab — app uses PM2 + native Node
- **LAMP/cPanel stacks** — wrong stack for Next.js
- **Cloudflare proxy** — not part of this deployment; DNS points directly to CloudOnFire

---

## Support

- **CloudOnFire VPS:** panel → Support
- **App deploy:** [`PHASE8_PRODUCTION_DEPLOY.md`](./PHASE8_PRODUCTION_DEPLOY.md)

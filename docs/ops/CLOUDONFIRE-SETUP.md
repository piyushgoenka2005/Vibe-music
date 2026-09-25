# CloudOnFire VPS setup (vibemusic.in)

**Panel:** [cp.cloudonfire.com](https://cp.cloudonfire.com) (Virtualizor)  
**App:** Next.js + PostgreSQL + PM2 — same as [`VPS-SETUP.md`](./VPS-SETUP.md), steps below are CloudOnFire-specific.

---

## Current blocker

If the dashboard shows **"Your VPS is still pending setup"** or **0 Running VPS**, the server is not online yet. Nothing in GitHub or the repo can deploy until this is finished.

---

## Step 1 — Finish VPS provisioning

1. Log in to **CloudOnFire** → **Compute** → **List VPS** (or **Launch VPS**).
2. Complete **Awaiting Setup** / **Complete Setup** for your VPS.
3. Recommended settings:

| Setting  | Value                                                   |
| -------- | ------------------------------------------------------- |
| OS       | **Ubuntu 22.04 LTS** or **24.04 LTS**                   |
| Hostname | `vibemusic` (or your choice)                            |
| Auth     | **SSH Keys** — upload `vibe_vps_deploy.pub` (see below) |
| RAM      | ≥ 2 GB (4 GB+ recommended for build + Postgres)         |
| Disk     | ≥ 40 GB                                                 |

4. Wait until status is **Online** and you have a **public IPv4** (note it for DNS).

**Generate/upload SSH key (local machine):**

```powershell
# If you already have the deploy key from Phase 8:
Get-Content $env:USERPROFILE\.ssh\vibe_vps_deploy.pub
```

Paste the public key in CloudOnFire → **SSH Keys** → **Add SSH Key**, then attach it when launching/completing the VPS.

---

## Step 2 — First login

Use one of:

- **SSH** (once online): `ssh root@<VPS_IP>`
- **Serial Console** or **VNC** in the panel (if SSH not ready yet)

---

## Step 3 — Bootstrap the app (one paste)

In the **web console as root** (Serial Console works):

```bash
curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/vps-console-go-live.sh | bash
```

When prompted, enter your **real 15-character GSTIN** (L-30).

This installs the GitHub deploy key, clones `Vibe-music`, merges secrets, runs migrations, builds, and starts PM2.

---

## Step 4 — Secrets

Edit on the VPS (never commit):

```bash
nano ~/Vibe-music/deploy/ops-secrets.env
```

Required: `DATABASE_URL`, `AUTH_SECRET`, Razorpay live keys, `GUEST_ORDER_ACCESS_SECRET`, SMTP, `UPSTASH_REDIS_*`.

Then:

```bash
cd ~/Vibe-music && node scripts/ops/merge-ops-secrets.mjs && bash deploy/update.sh
```

---

## Step 5 — DNS

Point **vibemusic.in** to the VPS IPv4:

| Where DNS lives                  | Action                                                 |
| -------------------------------- | ------------------------------------------------------ |
| CloudOnFire → **DNS Management** | Add zone `vibemusic.in`, A record `@` → VPS IP         |
| External registrar               | Set nameservers to Cloudflare **or** A record → VPS IP |

**For L-22 (WAF/CDN):** use **Cloudflare** orange-cloud proxy in front of the VPS IP (see [`deploy/cloudflare/README.md`](../../deploy/cloudflare/README.md)).

---

## Step 6 — CloudOnFire firewall (optional pre-Cloudflare)

Panel → **Firewall** → create a plan:

- **IN** TCP 22 (SSH) — your IP only if possible
- **IN** TCP 80, 443 — `0.0.0.0/0`
- Default policy **DROP**

After Cloudflare is live, run on the VPS for L-23:

```bash
sudo CLOUDFLARE_ONLY=1 bash deploy/complete-audit-go-live.sh
```

---

## Step 7 — Verify (from your PC)

```bash
VERIFY_BASE_URL=https://vibemusic.in npm run phase8:status
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
REQUIRE_COMPLIANCE=true REQUIRE_CDN_EDGE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
```

---

## GitHub Actions deploy (optional)

After Step 3, add GitHub repo secret:

- **Name:** `VPS_SSH_KEY`
- **Value:** contents of `~/.ssh/vibe_vps_deploy` (private key)

Workflow: `.github/workflows/deploy-production.yml`

---

## Do not use (for this app)

- **Docker** tab in CloudOnFire — app is designed for PM2 + native Node on Ubuntu
- **LAMP/cPanel/Webuzo** one-click stacks — wrong stack for Next.js 16
- **Development License** Virtualizor banner — contact CloudOnFire support if production panel shows dev license warnings

---

## Support contacts

- **CloudOnFire / VPS:** panel → Support
- **App deploy issues:** [`PHASE8_PRODUCTION_DEPLOY.md`](./PHASE8_PRODUCTION_DEPLOY.md)

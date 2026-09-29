# IP migration runbook — GoDaddy + CloudOnFire

**Confirmed (Sep 2026):**

|                   | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| Old IP (dead)     | `87.232.72.14`                                                |
| **New IP (live)** | **`31.42.125.219`**                                           |
| VPS               | CloudOnFire `1-YEAR-VPS-ULTRA`, Ubuntu 24.04, hostname `mail` |
| DNS               | GoDaddy (`ns39.domaincontrol.com`, `ns40.domaincontrol.com`)  |

The typo `31.42.215.219` is **not** your server — ignore it.

---

## Order of operations

1. **Back up** DNS (GoDaddy screenshot) + server `.env` + DB + CDN
2. **Server** — secrets, deploy, SSL, CDN files (before or in parallel with DNS)
3. **GoDaddy DNS** — A records + SPF
4. **GitHub** — `VPS_HOST` secret
5. **Validate** — smoke tests, images, mail

---

## A. CloudOnFire (cp.cloudonfire.com)

### Already done

- VPS **Online** at `31.42.125.219`
- Ubuntu 24.04, 10 vCPU, ~31 GB RAM
- SSH key slot exists (1 key in panel)

### You must verify / configure

| Step | Where                      | Action                                                                                                    |
| ---- | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1    | **Compute → List VPS**     | Confirm IP = `31.42.125.219`                                                                              |
| 2    | **Network → SSH Keys**     | Public key = your `vibe_vps_deploy.pub` attached to this VPS                                              |
| 3    | **Network → Firewall**     | Allow **IN**: TCP 22 (your IP if possible), 80, 443. For self-hosted mail also 25, 587, 993. Default DROP |
| 4    | **Console (monitor icon)** | Use if SSH fails                                                                                          |
| 5    | **Do not**                 | Open port 3000 (Node) or 5432 (Postgres) publicly                                                         |

### On the VPS (after SSH as root)

```bash
# Install deploy key for GitHub Actions + your PC
curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/install-deploy-key.sh | bash

# Full deploy (15–20 min)
curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/now.sh | bash

# Firewall (SSH + nginx only)
sudo bash ~/Vibe-music/deploy/vps-firewall.sh

# Optional: restrict SSH to your IP
sudo ADMIN_SSH_IP=YOUR.PUBLIC.IP bash ~/Vibe-music/deploy/vps-firewall.sh
```

### SSL (after DNS points here, or use certbot standalone first)

```bash
certbot --nginx -d vibemusic.in -d www.vibemusic.in -d cdn.vibemusic.in -d mail.vibemusic.in
```

`deploy/update.sh` syncs nginx configs for storefront + CDN on every deploy.

### CDN product images

```bash
ls /var/www/cdn/products | head
# If empty — restore backup:
ls /var/backups/vibe/cdn-backup-*.tar.gz
tar -xzf /var/backups/vibe/cdn-backup-YYYYMMDD.tar.gz -C /var/www
```

### Secrets on server (never commit)

```bash
nano ~/Vibe-music/.env
nano ~/Vibe-music/deploy/ops-secrets.env
cd ~/Vibe-music && node scripts/ops/merge-ops-secrets.mjs
```

Required: `DATABASE_URL`, `AUTH_SECRET`, Razorpay live keys, `GUEST_ORDER_ACCESS_SECRET`, SMTP, `CDN_*`, `UPSTASH_REDIS_*`.

---

## B. GoDaddy DNS

**Login:** [dcc.godaddy.com](https://dcc.godaddy.com) → **DNS** → `vibemusic.in`

Set TTL to **600 seconds** (10 min) during migration; raise to **1 hour** after stable.

| Type | Host / Name          | Current (observed)                  | **Set to**                               | Action                        |
| ---- | -------------------- | ----------------------------------- | ---------------------------------------- | ----------------------------- |
| A    | `@`                  | `87.232.72.14`                      | **`31.42.125.219`**                      | Edit                          |
| A    | `www`                | `87.232.72.14`                      | **`31.42.125.219`**                      | Edit (or CNAME → `@`)         |
| A    | `cdn`                | `87.232.72.14`                      | **`31.42.125.219`**                      | Edit                          |
| A    | `mail`               | `87.232.72.14`                      | **`31.42.125.219`**                      | Edit                          |
| MX   | `@`                  | `10 mail.vibemusic.in`              | **Keep**                                 | No change                     |
| TXT  | `@` (SPF)            | `v=spf1 mx a ip4:87.232.72.14 -all` | **`v=spf1 mx a:mail.vibemusic.in -all`** | Edit (remove old ip4)         |
| TXT  | `_dmarc`             | `v=DMARC1; p=quarantine; ...`       | **Keep**                                 | No change                     |
| TXT  | `default._domainkey` | _(missing)_                         | Add from server OpenDKIM                 | Add if using self-hosted mail |

**Do not delete** unrelated TXT records (Google verification, etc.).

### GoDaddy click path

1. **My Products** → domain **vibemusic.in** → **DNS**
2. Each **A** row → pencil icon → change **Value** → Save
3. **TXT** SPF row → edit → replace `ip4:87.232.72.14` with `a:mail.vibemusic.in`
4. Wait 5–30 minutes

### Verify from PC

```powershell
nslookup vibemusic.in
nslookup cdn.vibemusic.in
nslookup mail.vibemusic.in
```

All must return **`31.42.125.219`**.

---

## C. GitHub

Repo → **Settings → Secrets and variables → Actions**

| Secret        | Value                                |
| ------------- | ------------------------------------ |
| `VPS_HOST`    | `31.42.125.219`                      |
| `VPS_USER`    | `root`                               |
| `VPS_PORT`    | `22`                                 |
| `VPS_SSH_KEY` | private key `~/.ssh/vibe_vps_deploy` |

Re-run: **Actions → Deploy production (vibemusic.in)**

---

## D. Codebase (already aligned)

Application code uses **domains**, not public IPs:

- `vibemusic.in`, `cdn.vibemusic.in`, `mail.vibemusic.in`
- nginx → `127.0.0.1:3000`
- Ops script **defaults** already use `31.42.125.219`

**No `src/` changes required** for IP migration.

---

## E. External dashboards (no IP change)

| Service              | What to check                                                                          |
| -------------------- | -------------------------------------------------------------------------------------- |
| **Razorpay**         | Webhook `https://vibemusic.in/api/payment/webhook/razorpay`; domain whitelisted (Live) |
| **Google OAuth**     | Redirect `https://vibemusic.in/api/auth/callback/google`                               |
| **Google Analytics** | Unchanged                                                                              |

---

## F. Validation checklist

```bash
# On VPS
curl -s http://127.0.0.1:3000/api/health
bash ~/Vibe-music/deploy/post-deploy-smoke.sh
BASE_URL=https://vibemusic.in bash ~/Vibe-music/deploy/post-deploy-smoke.sh

# From PC
VERIFY_BASE_URL=https://vibemusic.in npm run check:edge
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
```

Manual:

- [ ] Homepage loads (not nginx default page)
- [ ] Product images on `/deals` and PDP
- [ ] Admin login
- [ ] `https://cdn.vibemusic.in/products/...` returns 200 for a real image URL

---

## G. Rollback

1. GoDaddy: restore A records to `87.232.72.14` (only works if old server returns — it is currently dead)
2. GitHub: revert `VPS_HOST` secret
3. Server: restore `.env.bak` and nginx backup if you created them

---

## H. Old IP restoration

**Not recommended** — `87.232.72.14` does not respond. CloudOnFire support can confirm if it was released. Proceed with `31.42.125.219`.

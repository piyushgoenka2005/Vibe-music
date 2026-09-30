# Fix SSL permanently (Cloudflare Tunnel)

## Why you see `NET::ERR_CERT_COMMON_NAME_INVALID`

CloudOnFire has **two servers** on `31.42.125.219`. About **30%** of HTTPS connections hit a **Forgejo/Gitea** VM that serves a certificate for `git.k12hunar.com` instead of `vibemusic.in`.

Your Vibe VPS certificate is valid. Public traffic is mis-routed at the provider.

**Nginx/certbot fixes on the VPS cannot stop this.** Only one of:

1. **CloudOnFire** removes the other VM or gives VPS 1055 a **dedicated IP** (see `IP-MIGRATION-GODADDY.md` §I), or
2. **Cloudflare Tunnel** — visitors connect to Cloudflare’s edge (valid cert); `cloudflared` on your VPS pulls traffic over an **outbound** tunnel (never hits the wrong VM).

## Recommended: Cloudflare Tunnel (~15 minutes)

### 1. Cloudflare account

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com) (free).
2. **Add site** → `vibemusic.in` → import DNS records.

### 2. Move nameservers (GoDaddy)

Cloudflare shows two nameservers (e.g. `ada.ns.cloudflare.com`).

1. GoDaddy → Domain → **DNS** → **Nameservers** → **Change** → **Custom**.
2. Enter Cloudflare’s two nameservers → Save.
3. Wait until Cloudflare dashboard shows **Active** (often 5–30 min).

### 3. VPS: login + install tunnel

SSH (use `scripts/ops/ssh-vps.ps1` until host key is correct):

```bash
cloudflared tunnel login    # opens URL — authorize vibemusic.in zone
cd ~/Vibe-music && git pull
sudo bash deploy/cloudflare/setup-tunnel.sh
```

### 4. Cloudflare SSL mode

In Cloudflare → **SSL/TLS** → **Overview** → set **Full** (origin is HTTP on :3000 via tunnel).

### 5. Verify

```powershell
powershell -ExecutionPolicy Bypass -File scripts\ops\verify-ssl.ps1 -Attempts 50
```

All 50 probes should pass. Browsers should no longer show privacy errors.

## Until tunnel is live

- Retry or use mobile data (different routing may hit the correct server).
- File CloudOnFire ticket (WhatsApp **+91 95606 14171**) — template in `IP-MIGRATION-GODADDY.md` §I.

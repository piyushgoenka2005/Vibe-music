# Phase 10 — Edge security (L-22 / L-23) — CloudOnFire

| Item             | Status (operator)                       | Verify                   |
| ---------------- | --------------------------------------- | ------------------------ |
| L-22 production  | nginx TLS + HSTS/CSP on CloudOnFire VPS | `npm run check:edge`     |
| L-23 origin lock | UFW: SSH + nginx only                   | `deploy/vps-firewall.sh` |

**Stack:** DNS → CloudOnFire VPS → nginx (80/443) → PM2 (127.0.0.1:3000). No Cloudflare proxy.

---

## Step 1 — DNS (L-22 prerequisite)

1. Point A records (`@`, `www`, `cdn`) to the CloudOnFire VPS IP.
2. On VPS: `bash deploy/update.sh` (syncs nginx + CDN site).
3. Verify: `VERIFY_BASE_URL=https://vibemusic.in npm run check:edge`

Guide: [`CLOUDONFIRE-SETUP.md`](./CLOUDONFIRE-SETUP.md)

---

## Step 2 — UFW (L-23)

```bash
sudo bash deploy/vps-firewall.sh
# Optional SSH restriction:
sudo ADMIN_SSH_IP=<your-ip> bash deploy/vps-firewall.sh
```

Or full go-live with lockdown:

```bash
sudo LOCKDOWN_UFW=1 bash deploy/complete-audit-go-live.sh
```

---

## Step 3 — Handoff script

```bash
VERIFY_BASE_URL=https://vibemusic.in bash deploy/phase10-edge-handoff.sh
# With UFW:
LOCKDOWN_UFW=1 VERIFY_BASE_URL=https://vibemusic.in bash deploy/phase10-edge-handoff.sh
```

---

## Checklist

- [ ] DNS `@`, `www`, `cdn` → VPS IP
- [ ] `npm run check:edge` — homepage 200 + HSTS + CSP
- [ ] `cdn.vibemusic.in` reachable
- [ ] `sudo ufw status` — SSH + nginx on 80/443
- [ ] `npm run verify:phase10` — L-22 PASS

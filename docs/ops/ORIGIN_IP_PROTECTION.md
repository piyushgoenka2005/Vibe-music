# Origin IP protection (L-23) — CloudOnFire

Traffic goes **directly** from the internet to the CloudOnFire VPS (no Cloudflare proxy). Protect the origin with:

1. **CloudOnFire panel firewall** — allow 22 (SSH, your IP), 80, 443; drop everything else.
2. **UFW on the VPS** — `sudo bash deploy/vps-firewall.sh`
3. **Node not exposed** — PM2 binds `127.0.0.1:3000`; only nginx is public on 80/443.
4. **fail2ban** — installed by `deploy/vps-hardening.sh` for SSH brute-force protection.

## Verify

```bash
# From your PC
VERIFY_BASE_URL=https://vibemusic.in npm run verify:phase10

# On VPS
sudo ufw status verbose
```

## DNS hygiene

- Do not publish alternate A records to old/dead VPS IPs.
- After IP changes, update `@`, `www`, and `cdn` together.

See [`CLOUDONFIRE-SETUP.md`](./CLOUDONFIRE-SETUP.md).

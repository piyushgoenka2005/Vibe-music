# Phase 1 — Infrastructure handoff (L-22 / L-23)

**Verified:** 25 Sep 2026 against https://vibemusic.in

## Live status (cannot be completed from repo alone)

| Check                  | Result                                             | Command                                                   |
| ---------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| CDN/WAF edge (L-22)    | **FAIL** — no `cf-ray`, `server: nginx/1.24.0`     | `VERIFY_BASE_URL=https://vibemusic.in npm run check:edge` |
| Origin firewall (L-23) | **Not applied** — UFW still allows world on 80/443 | Run after L-22                                            |

## Required operator actions

### 1. Cloudflare (L-22)

1. Add `vibemusic.in` to Cloudflare; point registrar NS to Cloudflare.
2. Orange-cloud (proxied) A/AAAA for `@` and `www`.
3. SSL/TLS → **Full (strict)**.
4. Verify: `npm run check:edge` shows `cf-ray`.

Guide: `deploy/cloudflare/README.md`

### 2. Origin lockdown (L-23)

After `cf-ray` is present:

```bash
sudo bash deploy/cloudflare-ufw.sh
# or full pipeline:
sudo CLOUDFLARE_ONLY=1 bash deploy/complete-audit-go-live.sh
```

Guide: `docs/ops/ORIGIN_IP_PROTECTION.md`

### 3. Deploy + compliance (L-30)

```bash
cd ~/Vibe-music && git pull origin main
# Set NEXT_PUBLIC_GSTIN and NEXT_PUBLIC_LEGAL_ENTITY_NAME in deploy/ops-secrets.env
sudo bash deploy/complete-audit-go-live.sh
```

### 4. SSH deploy key

Local key: `~/.ssh/vibe_vps_deploy` (generated via `scripts/ops/setup-deploy-access.ps1`)

Attach in CloudOnFire panel → re-run `scripts/ops/verify-ssh.ps1`

## Strict sign-off gate

```bash
REQUIRE_CDN_EDGE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
```

This blocks until CDN edge markers are present.

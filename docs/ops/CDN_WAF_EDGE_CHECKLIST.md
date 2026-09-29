# Production edge checklist (L-22) — CloudOnFire VPS

Application code ships HSTS, CSP, and related headers via Next.js. **TLS termination and DDoS absorption are handled by nginx on the CloudOnFire VPS** — there is no Cloudflare or third-party CDN proxy in this stack.

## Verify edge is active

```bash
npm run check:edge
# or
VERIFY_BASE_URL=https://vibemusic.in node scripts/ops/check-edge-headers.mjs
```

Expect:

| Check    | Pass criteria                                 |
| -------- | --------------------------------------------- |
| Homepage | HTTP 200 over HTTPS                           |
| HSTS     | `strict-transport-security` with `max-age=`   |
| CSP      | `content-security-policy` with `default-src`  |
| nosniff  | `x-content-type-options: nosniff`             |
| CDN host | `https://cdn.vibemusic.in` responds (not 5xx) |
| server   | Typically `nginx`                             |

## Setup (CloudOnFire)

1. Point DNS A records (`@`, `www`, `cdn`) to the VPS IP.
2. Run `bash deploy/update.sh` — syncs nginx for both storefront and CDN.
3. Ensure `/var/www/cdn/products` exists and is populated.
4. Enable UFW: `sudo bash deploy/vps-firewall.sh`
5. Optional: restrict SSH with `ADMIN_SSH_IP` in the firewall script.

## After changes

- Re-run `npm run check:edge`
- Re-run `VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff`
- Full path: `bash deploy/certify-production.sh`

See [`CLOUDONFIRE-SETUP.md`](./CLOUDONFIRE-SETUP.md) for the complete runbook.

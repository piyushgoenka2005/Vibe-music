# CDN / WAF edge checklist (L-22)

Application code ships HSTS, CSP, and related headers via `next.config.ts`. **DDoS absorption and origin shielding require infrastructure** in front of the VPS.

## Verify edge is active

```bash
npm run check:edge
# or
VERIFY_BASE_URL=https://vibemusic.in node scripts/ops/check-edge-headers.mjs
```

Look for at least one CDN marker:

| Header        | Provider   |
| ------------- | ---------- |
| `cf-ray`      | Cloudflare |
| `x-vercel-id` | Vercel     |
| `x-amz-cf-id` | CloudFront |

If all are absent, traffic is likely hitting the origin directly.

## Recommended setup (Cloudflare free tier)

1. Add `vibemusic.in` to Cloudflare and point DNS through the orange cloud (proxied).
2. Enable **SSL/TLS → Full (strict)**.
3. Turn on **WAF managed rules** (free tier basics) and **Bot Fight Mode** if needed.
4. Add a **rate limiting** rule for `/api/auth/*` and `/api/payment/*` (complements in-app limits).
5. **Firewall the origin VPS** so only Cloudflare IP ranges can reach ports 80/443.
6. Rotate origin IP if historical DNS records exposed the bare VPS IP (L-23).

## After changes

- Re-run `npm run check:edge` — expect `cf-ray` (or your CDN marker).
- Re-run `VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff`.

This checklist closes **L-22** at the infrastructure layer; no further app code changes are required once edge headers are present.

# Production QA and performance audit — 18 August 2026

## Executive status: release blocked

The customer-facing production URL is `https://vibemusic.in`, not `https://cp.cloudonfire.com`.

`cp.cloudonfire.com` is the CloudOnFire Virtualizor control-panel login. It is not a Vibe Music deployment and returns `404` for `/login` and `/admin`. Do not direct customers to it and do not point the storefront domain at it. Restrict its use to VPS administration.

## Live measurements

Measurements below were taken from an external cold/warm request path on 18 August 2026 (Asia/Kolkata).

| Check | Result | Severity | Release decision |
| --- | --- | --- | --- |
| `cp.cloudonfire.com/` | Virtualizor login; 568,654 byte HTML; 1.30 s TTFB | Critical | Wrong hostname for the product website |
| `cp.cloudonfire.com/login` | `404` from nginx | Critical | Storefront route does not exist here |
| `cp.cloudonfire.com/admin` | `404` from nginx | Critical | Admin route does not exist here |
| `vibemusic.in/` | `200`; 692,580 byte HTML; 0.98 s TTFB; 1.63 s transfer | High | Oversized initial document; investigate homepage payload/client JS |
| `vibemusic.in/login` | `200`; 0.44 s TTFB | Pass | Acceptable baseline |
| `vibemusic.in/api/health` | `200`; 11.24 s then 5.90 s TTFB | Critical | Database/Node path is materially slow |
| `vibemusic.in/api/auth/providers` | `200`; 6.15 s first call, 0.73 s repeat | High | Cold-path latency can make Google login feel broken |
| `vibemusic.in/api/products?limit=1` | `200`; 0.85 s TTFB | Watch | Monitor against a 500 ms goal |
| `vibemusic.in/api/banners` | `200`; 0.42 s TTFB | Pass | Acceptable baseline |

Google is enabled in production and advertises the correct redirect URL: `https://vibemusic.in/api/auth/callback/google`.

## Root causes and corrective work

1. **Deployment URL confusion — critical.** The VPS control-panel hostname has been treated as the site URL. The canonical customer URL remains `https://vibemusic.in`; it must be the value of `NEXT_PUBLIC_SITE_URL`, the Google OAuth authorised origin, and the Google OAuth callback URI.
2. **Google account collision — fixed in source.** Existing password accounts were rejected by Auth.js before the profile reconciliation code could run. The Google provider now auto-links a matching verified Google email by default. Set `AUTH_ALLOW_DANGEROUS_EMAIL_LINKING=false` only after delivering an authenticated, explicit-linking flow.
3. **Homepage image blank/failure state — fixed in source.** `HomepageProductImage` claimed to fall back to the CDN original but only generated one candidate. It now uses the shared candidate builder, retaining the original CDN URL after the optimized thumb fails.
4. **Backend latency — deployment investigation required.** The health endpoint only executes `SELECT 1`; 5.9–11.2 s proves the bottleneck is database connectivity/host saturation rather than application work. Inspect VPS CPU/RAM/disk wait, Postgres connection pressure, slow queries, and PM2 restarts before release.
5. **Admin scaling risk — open.** The dashboard aggregates complete order lists in memory and repeats order reads for statistics, charting, recent orders, and top products. It will become slower as the order table grows. Replace these with bounded/aggregated SQL queries and measure the authenticated dashboard endpoint after the database issue is resolved.

**Update:** duplicate full-order reads have been removed from the dashboard route. One request now uses one consistent order snapshot for all widgets. A later data-scale pass should replace the remaining in-memory snapshot with database aggregates and a bounded recent-order query.

## Required production actions

1. Deploy this commit to the VPS and restart the `vibe` PM2 process with its production environment.
2. Set `AUTH_ALLOW_DANGEROUS_EMAIL_LINKING=true` in the VPS `.env`; confirm `AUTH_URL` is omitted or equals `https://vibemusic.in`.
3. In Google Cloud OAuth, retain only the production origin/callback shown above (and any intentional local-development URLs).
4. Obtain SSH access, then run `bash deploy/server-audit.sh` and capture `pg_stat_activity`, `pg_stat_database`, `free -h`, `uptime`, `iostat -xz 1 5`, and `pm2 logs vibe --lines 100 --nostream`. The health target is under 500 ms at p95.
5. Run `npm run verify:prod-signoff` and `LIGHTHOUSE_BASE_URL=https://vibemusic.in npm run audit:lighthouse` after deployment. Do not mark the release complete while `/api/health` exceeds 1 second or an image has a broken final URL.

## QA acceptance card

- [ ] Customer uses `https://vibemusic.in`, never the `cp` control-panel hostname.
- [ ] Homepage, product listing, product detail, cart, checkout, login, and password reset return `200`.
- [ ] All above-the-fold product/banner images load; thumbnail failure switches to the original CDN image.
- [ ] A pre-existing password customer can continue with the same verified Google email without `OAuthAccountNotLinked`.
- [ ] Auth provider endpoint and health endpoint are under 1 s on repeated external checks.
- [ ] Admin dashboard opens under 2 s with production-like data, and no route returns `5xx`.
- [ ] Lighthouse, type check, lint, tests, build, and production sign-off pass.

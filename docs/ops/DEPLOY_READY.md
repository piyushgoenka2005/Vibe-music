# End-to-end deploy readiness (v1.1.0)

Single runbook from “code on `main`” → “live parity + ops cron + smoke green.”

Companion: [DEPLOYMENT.md](./DEPLOYMENT.md) · [GO_LIVE.md](./GO_LIVE.md) · [GOOGLE_SEARCH_CONSOLE.md](./GOOGLE_SEARCH_CONSOLE.md)

---

## EMERGENCY — site down / images missing (VPS IP changed)

**Current VPS IP:** `31.42.125.219` (hostname `mail.vibemusic.in`). The old IP `87.232.72.14` is dead.

### 1. Update DNS (required — site will not load until this propagates)

At **GoDaddy DNS** (nameservers `ns39.domaincontrol.com` / `ns40.domaincontrol.com`), set **A records** → `31.42.125.219`:

| Host                 | Type       | Value                             |
| -------------------- | ---------- | --------------------------------- |
| `@` (`vibemusic.in`) | A          | `31.42.125.219`                   |
| `www`                | A or CNAME | `31.42.125.219` or `vibemusic.in` |
| `cdn`                | A          | `31.42.125.219`                   |
| `mail`               | A          | `31.42.125.219`                   |

Update SPF TXT: replace `ip4:87.232.72.14` with `a:mail.vibemusic.in` (or `ip4:31.42.125.219`).

Full runbook: **[IP-MIGRATION-GODADDY.md](./IP-MIGRATION-GODADDY.md)**

Verify: `nslookup vibemusic.in`, `cdn.vibemusic.in`, and `mail.vibemusic.in` should return `31.42.125.219`.

### 2. Deploy on the VPS (SSH or Serial Console as root)

```bash
curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/now.sh | bash
```

First deploy on a fresh VPS may take 10–20 minutes (npm ci + `next build`). Keep the session open.

### 3. GitHub Actions secret

Repo → Settings → Secrets → `VPS_HOST` = `31.42.125.219`.

### 4. CDN files

Product images live under `/var/www/cdn` on the VPS. If missing after migrate, restore from backup or run `npm run sync:cdn-vps` from a machine that has `.data/cdn/products`.

---

## 0. Preflight (local or CI)

```bash
npm run verify:complete    # master repo gate (copy + audit + optional live probes)
npm run release:ready      # verify:complete + production build
npm run check:env          # against VPS .env values, not localhost AUTH_URL
# full CI parity: npm run validate:ci
```

See **[PRODUCTION_COMPLETE.md](./PRODUCTION_COMPLETE.md)** for the final checklist.

Ensure the commit you want live is on **`origin/main`** (`deploy/update.sh` pulls `main` only).

**Production env (VPS `.env`):**

```bash
NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH=false
CDN_PUBLIC_BASE_URL=https://cdn.vibemusic.in
CDN_STORAGE_ROOT=/var/www/cdn
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=...
# Optional but recommended:
SENTRY_DSN=https://...@....ingest.sentry.io/...
```

Startup **fails in production** without Upstash REST credentials (distributed rate limiting). See `docs/audit/PRODUCTION_AUDIT_2026-09-30.md`.

---

## 1. One-shot on VPS (recommended)

```bash
cd /root/Vibe-music   # or your APP_DIR
git fetch origin main && git pull --ff-only origin main

# Fastest path to live 10/10:
bash deploy/certify-production.sh

# Or step-by-step:
bash deploy/finish-production.sh

# Ops secrets + gap checklist:
cp -n deploy/ops-secrets.env.example deploy/ops-secrets.env
# edit deploy/ops-secrets.env → then:
bash deploy/complete-ops-gaps.sh
```

`complete-ops-gaps.sh` will:

1. Pull `main`
2. Merge ops secrets → `.env`
3. `check:env`
4. Run `deploy/update.sh` (ci → migrate → type-check → build → PM2)
5. Seed phone/banners
6. Install Postgres/CDN backups cron
7. Install reservation sweeper cron
8. Razorpay ops checks (no charge)
9. Post-deploy smoke (localhost + public)

---

## 2. Minimal update (code only)

```bash
cd /root/Vibe-music
bash deploy/update.sh
# Optional catalog reseed:
# SEED_CATALOG=1 bash deploy/update.sh
```

Then:

```bash
bash deploy/install-reservation-sweeper.sh   # once if not already installed
bash deploy/post-deploy-smoke.sh
BASE_URL=https://vibemusic.in bash deploy/post-deploy-smoke.sh
```

---

## 3. Env keys that must be set on VPS

**Required** (see `.env.production.example` + `npm run check:env`):

- `NEXT_PUBLIC_SITE_URL=https://vibemusic.in`
- `DATABASE_URL`, `AUTH_SECRET`, `GUEST_ORDER_ACCESS_SECRET`
- Razorpay trio + webhook secret
- SMTP **or** `RESEND_API_KEY`

**Recommended for 100% live config:**

| Key                                                           | Why                      |
| ------------------------------------------------------------- | ------------------------ |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`                        | GSC HTML-tag ownership   |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` + `GA_MEASUREMENT_API_SECRET` | Analytics                |
| `NEXT_PUBLIC_STORE_PHONE`                                     | Storefront/contact       |
| `GOOGLE_PLACES_API_KEY` (or alias)                            | Checkout autocomplete    |
| `CDN_STORAGE_ROOT` + `CDN_PUBLIC_BASE_URL`                    | Admin uploads            |
| `UPSTASH_*`                                                   | Multi-worker rate limits |

After changing `NEXT_PUBLIC_*`, rebuild or restart with a fresh build (`update.sh` rebuilds).

---

## 4. Smoke gates (must be green)

| Check                                  | Expect                       |
| -------------------------------------- | ---------------------------- |
| `GET /api/health`                      | 200, DB ok                   |
| `GET /api/coupons/active`              | **200** `{ coupons: [...] }` |
| `GET /api/checkout/capabilities`       | razorpay on, demo off        |
| `GET /api/admin/me`                    | 401                          |
| Bulk template CSV in repo              | ≥81 columns incl. `image12`  |
| `GET /robots.txt` + `/sitemap.xml`     | 200                          |
| `GET /` `/giveaway` `/rentals` `/blog` | 200                          |

Script: `bash deploy/post-deploy-smoke.sh`

---

## 5. Ops cron (once per host)

| Cron                           | Installer                                    |
| ------------------------------ | -------------------------------------------- |
| Daily Postgres + CDN backups   | `bash deploy/install-backups.sh`             |
| Reservation TTL sweeper (*/15) | `bash deploy/install-reservation-sweeper.sh` |

Example lines also in `deploy/crontab.backups.example`.

---

## 6. Google Search Console (operator)

1. Put token in VPS `.env`: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=...`
2. Redeploy / rebuild so metadata ships
3. Verify property + submit `https://vibemusic.in/sitemap.xml`  
   Details: [GOOGLE_SEARCH_CONSOLE.md](./GOOGLE_SEARCH_CONSOLE.md)

---

## 7. Done when

- [ ] `origin/main` contains the release commit
- [ ] `bash deploy/update.sh` finished without error
- [ ] Localhost + public smoke PASS (`/api/coupons/active` = 200)
- [ ] Backups + reservation sweeper crons installed
- [ ] GSC token set (or consciously deferred)
- [ ] Admin login works; one Razorpay test payment optional

**Live 100%** = smoke green on `https://vibemusic.in` after this runbook.

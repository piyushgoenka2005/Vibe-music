# ViBE Music

Production ecommerce for musical instruments and pro audio — **vibemusic.in**

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| App      | Next.js 16 (App Router) · React 19 · TypeScript |
| Database | PostgreSQL on VPS (Prisma)                      |
| Auth     | Auth.js (credentials + Google OAuth)            |
| Payments | **Razorpay only** (live mode in production)     |
| Hosting  | **CloudOnFire VPS** — nginx → PM2 → PostgreSQL  |
| CDN      | `cdn.vibemusic.in` (nginx static on same VPS)   |
| DNS      | GoDaddy A records → `31.42.125.219`             |

---

## Production infrastructure

```
GoDaddy DNS → CloudOnFire VPS (31.42.125.219)
                ├── nginx :80 / :443  (vibemusic.in, www, cdn, mail)
                ├── PM2 vibe          → Next.js :3000 (127.0.0.1)
                ├── PM2 vibe-worker   → background jobs (Redis)
                ├── PostgreSQL        → localhost:5432
                └── /var/www/cdn      → product & media files
```

| Item         | Value                                                |
| ------------ | ---------------------------------------------------- |
| VPS provider | [CloudOnFire](https://cp.cloudonfire.com)            |
| IP           | `31.42.125.219`                                      |
| SSH user     | `root`                                               |
| App path     | `~/Vibe-music`                                       |
| Host key     | `SHA256:l0hpirMy/wrm0gRH4SNxl4PdMmpzKXtSFOjfMESvX7I` |

**Do not** use bare `ssh root@31.42.125.219` — the IP is sometimes routed to another host. Use the deploy-key helper:

```powershell
npm run ops:ssh
npm run ops:verify-ssh
```

---

## Deploy to production

### Routine deploy (on VPS)

```bash
cd ~/Vibe-music
bash deploy/update.sh
```

`deploy/update.sh` runs: preflight → git pull → DB backup → `npm ci` → migrate → build → PM2 reload → nginx sync → health gate → smoke tests.

**Options:**

| Variable                               | Effect                                   |
| -------------------------------------- | ---------------------------------------- |
| `SKIP_PULL=1`                          | Skip git pull                            |
| `SKIP_SMOKE=1`                         | Skip smoke tests                         |
| `SKIP_BUILD=1`                         | Reload PM2 only (env hotfix)             |
| `SYNC_SSL=1`                           | Expand Let's Encrypt certs (default: on) |
| `AUTO_FIX_SSL=0`                       | Skip auto SSL repair on cert failure     |
| `VERIFY_PUBLIC_SMOKE=1`                | Smoke `https://vibemusic.in` via nginx   |
| `VERIFY_BASE_URL=https://vibemusic.in` | Run edge header check                    |
| `SEED_CATALOG=1`                       | Re-import catalog JSON                   |

Full production pass:

```bash
VERIFY_PUBLIC_SMOKE=1 SYNC_SSL=1 VERIFY_BASE_URL=https://vibemusic.in bash deploy/update.sh
```

### One-shot certification

```bash
bash deploy/production.sh certify
# With UFW lockdown:
LOCKDOWN_UFW=1 bash deploy/production.sh certify
```

### First-time VPS bootstrap

```bash
cd ~/Vibe-music
cp deploy/ops-secrets.env.example deploy/ops-secrets.env
nano deploy/ops-secrets.env
bash deploy/update.sh
bash deploy/production.sh certify
```

### GitHub Actions deploy

Push to `main` triggers `.github/workflows/deploy-production.yml`.

**Secrets:** `VPS_HOST=31.42.125.219`, `VPS_USER=root`, `VPS_PORT=22`, `VPS_SSH_KEY` (private key from `%USERPROFILE%\.ssh\vibe_vps_deploy`).

Generate key: `powershell -ExecutionPolicy Bypass -File scripts/ops/setup-deploy-access.ps1`

### Rollback

```bash
bash deploy/production.sh rollback
# or explicit SHA:
bash deploy/production.sh rollback <known-good-commit>
```

---

## DNS (GoDaddy)

Point these **A records** to `31.42.125.219`:

| Host   | Purpose           |
| ------ | ----------------- |
| `@`    | vibemusic.in      |
| `www`  | www.vibemusic.in  |
| `cdn`  | cdn.vibemusic.in  |
| `mail` | mail.vibemusic.in |

Verify: `nslookup vibemusic.in` and `nslookup cdn.vibemusic.in`

Update SPF TXT when IP changes: use `a:mail.vibemusic.in` or `ip4:31.42.125.219`.

---

## Environment variables

Copy [`.env.production.example`](.env.production.example) to the VPS `.env`. Merge secrets from `deploy/ops-secrets.env`:

```bash
node scripts/ops/merge-ops-secrets.mjs
```

### Required in production

| Variable                                              | Purpose                                        |
| ----------------------------------------------------- | ---------------------------------------------- |
| `DATABASE_URL`                                        | `postgresql://vibe:<pass>@localhost:5432/vibe` |
| `AUTH_SECRET`                                         | Session signing (≥ 32 chars)                   |
| `NEXT_PUBLIC_SITE_URL`                                | `https://vibemusic.in`                         |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`             | Live payment keys                              |
| `RAZORPAY_WEBHOOK_SECRET`                             | Webhook HMAC                                   |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`                         | Client Razorpay key                            |
| `GUEST_ORDER_ACCESS_SECRET`                           | Guest order tokens                             |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Rate limiting                                  |
| `CDN_STORAGE_ROOT`                                    | `/var/www/cdn`                                 |
| `CDN_PUBLIC_BASE_URL`                                 | `https://cdn.vibemusic.in`                     |
| `TRUST_PROXY_HOPS`                                    | `1` (behind nginx)                             |

### Compliance (L-30)

| Variable                        | Purpose                  |
| ------------------------------- | ------------------------ |
| `NEXT_PUBLIC_GSTIN`             | 15-char GSTIN in footer  |
| `NEXT_PUBLIC_LEGAL_ENTITY_NAME` | Registered business name |

### Email

`SMTP_HOST` + `SMTP_USER` + `SMTP_PASS`, **or** `RESEND_API_KEY`.

Mailboxes: `orders@`, `support@`, `info@`, `contact@`, `billing@vibemusic.in`

### Optional

`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `SENTRY_DSN`, `NEXT_PUBLIC_CRISP_WEBSITE_ID`

**Never** set `AUTH_URL=http://localhost:3000` in production.

---

## Database

PostgreSQL runs on the same VPS as the app.

```bash
npm run db:migrate          # apply migrations
npm run seed:admin          # first super-admin
npm run db:studio           # Prisma Studio (dev)
```

Pre-deploy backup (automatic in `update.sh`): `~/backups/pre-deploy-*.dump`

---

## CDN & images

```env
CDN_STORAGE_ROOT=/var/www/cdn
CDN_PUBLIC_BASE_URL=https://cdn.vibemusic.in
```

Sync local assets to VPS:

```powershell
npm run sync:cdn-vps
```

Download storefront images on deploy: `npm run download:images` (runs inside `update.sh`).

nginx sync: `bash deploy/production.sh nginx` (configs embedded in `deploy/production.sh`)

---

## Firewall & SSL

**UFW on VPS:**

```bash
sudo bash deploy/vps-firewall.sh
```

Opens SSH (22) and nginx (80/443). Node stays on `127.0.0.1:3000`.

**SSL (Let's Encrypt):**

```bash
SYNC_SSL=1 bash deploy/update.sh
# or repair on VPS:
bash deploy/fix-ssl-certificates.sh
# verify from your PC / CI (detects CloudOnFire duplicate IP):
npm run verify:ssl
```

Certs cover `vibemusic.in`, `www.vibemusic.in`, `mail.vibemusic.in`.

If browsers show `NET::ERR_CERT_COMMON_NAME_INVALID`, the public IP may be routing to another
tenant (Gitea `git.k12hunar.com`). See [`docs/ops/cloudonfire-duplicate-ip-ticket.txt`](docs/ops/cloudonfire-duplicate-ip-ticket.txt).

---

## Quality gates

Run before merging or deploying:

```bash
npm run validate            # type-check + lint + unit tests + build
npm run test:e2e            # Playwright (needs local Postgres)
npm run validate:ci         # validate + E2E (matches CI)
npm run verify:complete       # copy + audit remediation
npm run release:ready         # verify:complete + build
npm run check:env             # production env keys
```

**After deploy (from dev machine or VPS):**

```bash
VERIFY_BASE_URL=https://vibemusic.in npm run check:edge
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
```

CI: `.github/workflows/validate.yml` blocks merge on test failure.

---

## Local development

```bash
npm install
cp .env.example .env.local
docker compose up -d postgres
npm run setup:local
npm run seed:catalog          # optional
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
src/                 App Router, components, API routes, server libs
prisma/              Schema + migrations
public/              Static assets
deploy/              VPS scripts, PM2 config, nginx templates
scripts/
  db/                Prisma, seeds, local Postgres bootstrap
  ops/               Env check, SSH helpers, verification
  assets/            Image download, favicons
e2e/                 Playwright tests
.github/workflows/   CI + production deploy
docs/
  README.md          Documentation index
  ARCHITECTURE.md    System design reference
  INCIDENT_RESPONSE.md  Production incident runbook
  ops/               Ops index (see deploy/ for scripts)
  audit/             Audit checklist JSON
  templates/         Bulk import templates
```

---

## Key npm scripts

| Script                        | Purpose                        |
| ----------------------------- | ------------------------------ |
| `npm run deploy:update`       | Run `deploy/update.sh` on VPS  |
| `npm run ops:ssh`             | SSH to CloudOnFire VPS         |
| `npm run ops:verify-ssh`      | Test deploy key                |
| `npm run sync:cdn-vps`        | Push CDN files to VPS          |
| `npm run download:images`     | Fetch storefront static images |
| `npm run verify:integrations` | Smoke public APIs              |
| `npm run monitor:checkout`    | Synthetic checkout probe       |

---

## Incident response

Production incidents: see **[docs/INCIDENT_RESPONSE.md](docs/INCIDENT_RESPONSE.md)**.

Quick checks on VPS:

```bash
pm2 status
pm2 logs vibe --lines 100
curl -s http://127.0.0.1:3000/api/health | jq
sudo nginx -t && sudo systemctl status nginx
```

---

## Architecture

Detailed system design: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

**Not in this stack:** Stripe, Elasticsearch, Firestore, Cloudinary SDK, third-party CDN/WAF proxies.

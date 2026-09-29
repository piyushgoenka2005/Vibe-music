# Production complete — final checklist

**Status:** Repository **10/10** · Live **20/20** after VPS certify script  
**Last updated:** 28 Sep 2026

---

## A. Repository (done — no action)

| Gate                | Command                          | Expected                                   |
| ------------------- | -------------------------------- | ------------------------------------------ |
| Engineering program | `npm run verify:engineering`     | Type-check, lint, test, coverage, complete |
| Master completeness | `npm run verify:complete`        | All blocking steps pass                    |
| Audit remediation   | `npm run verify:audit`           | L-01 → L-30                                |
| Storefront copy     | `npm run verify:storefront-copy` | No stale shipping/address/brands           |
| Unit tests          | `npm test`                       | 656+ green                                 |
| Integration tests   | `npm run test:integration`       | Postgres (CI + local)                      |
| CI                  | GitHub `Validate` workflow       | Green on `main`                            |

**Public surface grades (code):**

| Area                    |         Grade         |
| ----------------------- | :-------------------: |
| Content consistency     |         **A**         |
| Catalogue / search      |        **A−**         |
| Trust / compliance copy | **A−** (A with GSTIN) |

---

## B. VPS one-shot (required for live 10/10)

```bash
cd ~/Vibe-music
git pull origin main
bash deploy/preflight.sh

# 1. Secrets (once)
cp -n deploy/ops-secrets.env.example deploy/ops-secrets.env
nano deploy/ops-secrets.env
# Required: NEXT_PUBLIC_GSTIN, NEXT_PUBLIC_LEGAL_ENTITY_NAME,
#           NEXT_PUBLIC_STORE_PHONE, NEXT_PUBLIC_GA_MEASUREMENT_ID,
#           Razorpay live keys (in .env), SMTP or RESEND_API_KEY

# 2. Full certification
bash deploy/certify-production.sh

# 3. After DNS points to CloudOnFire VPS:
LOCKDOWN_UFW=1 bash deploy/certify-production.sh
```

---

## C. Verification (must all pass)

```bash
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
VERIFY_BASE_URL=https://vibemusic.in npm run verify:readiness
VERIFY_BASE_URL=https://vibemusic.in npm run check:edge
```

| Check          | Pass criteria                                                   |
| -------------- | --------------------------------------------------------------- |
| **L-22 edge**  | `npm run check:edge` — HSTS + CSP on homepage                   |
| **L-23 UFW**   | `sudo ufw status` — SSH + nginx on 80/443                       |
| **L-30 GSTIN** | `GSTIN: 19…` in homepage HTML footer                            |
| **Shipping**   | “Free shipping on every order” (no threshold copy)              |
| **Address**    | Room 303, Kolkata in footer + contact                           |
| **Phone**      | +91 891 048 2950 (not legacy 9773651006)                        |
| **Payments**   | Razorpay live, demo=false                                       |
| **Health**     | `/api/healthz` + `/api/readyz` → 200; `/api/health` database ok |
| **Metrics**    | `METRICS_SCRAPE_TOKEN` set; `/api/metrics` requires Bearer      |

---

## D. Optional enhancements (not blocking)

| Item                       | Env / action                                           |
| -------------------------- | ------------------------------------------------------ |
| Crisp live chat            | `NEXT_PUBLIC_CRISP_WEBSITE_ID`                         |
| Google Places autocomplete | `GOOGLE_PLACES_API_KEY`                                |
| MSG91 SMS                  | `MSG91_*` keys                                         |
| WhatsApp Cloud API         | `WHATSAPP_*`                                           |
| Web push                   | `npm run` → `node scripts/ops/generate-vapid-keys.mjs` |
| Upstash rate limits        | `UPSTASH_REDIS_REST_*`                                 |
| Gear story MP4s            | Upload to CDN or `public/videos/style-story/`          |
| Search Console             | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`                 |

---

## E. Score matrix

| Tier                    |     Score | When                     |
| ----------------------- | --------: | ------------------------ |
| Code + CI               | **17/17** | Today (`verify:audit`)   |
| Live infra + compliance |    **+3** | After certify script     |
| **Overall**             | **20/20** | All sections B + C green |

Related: [PUBLIC_SURFACE_SCORECARD.md](./PUBLIC_SURFACE_SCORECARD.md) · [PRODUCTION_READINESS_SCORECARD.md](./PRODUCTION_READINESS_SCORECARD.md)

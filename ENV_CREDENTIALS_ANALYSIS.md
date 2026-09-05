# Environment Variables & Credentials Analysis

## Current Setup Issues

**Problem:** You have multiple `.env` files:

- `.env` (production/primary)
- `.env.local` (development override)
- `.env.example` (template)
- `.env.production.example` (production template)

**Root Cause:** Next.js loads in this order (latest wins):

1. `.env` (always loaded)
2. `.env.{NODE_ENV}` (development/production/test)
3. `.env.local` (always loaded, **overrides .env**)
4. `.env.{NODE_ENV}.local` (development-local, **overrides everything**)

So `.env.local` **IS being used** and is overriding `.env` values.

---

## All Credentials in Codebase

### Public Environment Variables (exposed to browser)

These can be in `.env` or `.env.local` — no security issue:

| Variable                                   | Required? | Purpose                             | Scope      |
| ------------------------------------------ | --------- | ----------------------------------- | ---------- |
| `NEXT_PUBLIC_SITE_URL`                     | **PROD**  | Site URL for auth callbacks, emails | All        |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`              | **PROD**  | Payment gateway public key          | Storefront |
| `NEXT_PUBLIC_STORE_PHONE`                  | Optional  | Contact phone in UI                 | Storefront |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`     | Optional  | GSC ownership token                 | Storefront |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`            | Optional  | Google Analytics                    | Storefront |
| `NEXT_PUBLIC_GTM_ID`                       | Optional  | Google Tag Manager                  | Storefront |
| `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`         | Optional  | Newsletter form                     | Storefront |
| `NEXT_PUBLIC_CART_FREE_SHIPPING_THRESHOLD` | Optional  | Promo thresholds                    | Storefront |
| `NEXT_PUBLIC_CART_FREE_GIFT_THRESHOLD`     | Optional  | Promo thresholds                    | Storefront |
| `NEXT_PUBLIC_CART_GIFT_PRODUCT_ID`         | Optional  | Gift product ID                     | Storefront |
| `NEXT_PUBLIC_ENABLE_SPLASH_CURSOR`         | Optional  | Desktop cursor effect               | Storefront |
| `NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH`      | Optional  | Splash screen                       | Storefront |
| `NEXT_PUBLIC_ENABLE_PWA`                   | Optional  | Service worker                      | Storefront |
| `NEXT_PUBLIC_GP9_GLB`                      | Optional  | 3D model flag                       | Storefront |
| `NEXT_PUBLIC_INVOICE_PDF_ENABLED`          | Optional  | Invoice PDF downloads               | Storefront |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`             | Optional  | Web push public key                 | Storefront |

---

### Secret/Server-Only Variables (must NEVER be in `.env.local` in production)

These should be in `.env` on VPS or GitHub Secrets in CI:

| Variable                             | Required? | Purpose                    | Scope   | Security                      |
| ------------------------------------ | --------- | -------------------------- | ------- | ----------------------------- |
| `AUTH_SECRET`                        | **PROD**  | Auth.js session encryption | Backend | Min 32 chars                  |
| `AUTH_URL`                           | Optional  | Auth callback URL          | Backend | Override trustHost            |
| `AUTH_GOOGLE_ID`                     | **PROD**  | Google OAuth app ID        | Backend | Secret                        |
| `AUTH_GOOGLE_SECRET`                 | **PROD**  | Google OAuth secret        | Backend | Secret                        |
| `GOOGLE_CLIENT_ID`                   | Optional  | Google Places              | Backend | Alias for AUTH_GOOGLE_ID      |
| `GOOGLE_CLIENT_SECRET`               | Optional  | Google Places              | Backend | Alias                         |
| `GOOGLE_PLACES_API_KEY`              | Optional  | Maps/address autocomplete  | Backend | Can be in .local              |
| `DATABASE_URL`                       | **PROD**  | PostgreSQL connection      | Backend | Secret                        |
| `RAZORPAY_KEY_ID`                    | **PROD**  | Payment webhook secret     | Backend | Secret                        |
| `RAZORPAY_KEY_SECRET`                | **PROD**  | Payment webhook secret     | Backend | Secret                        |
| `RAZORPAY_WEBHOOK_SECRET`            | **PROD**  | Payment webhook validation | Backend | Secret                        |
| `SMTP_HOST`                          | **PROD**  | Email server               | Backend | Semi-public                   |
| `SMTP_PORT`                          | **PROD**  | Email port                 | Backend | Semi-public                   |
| `SMTP_USER`                          | **PROD**  | Email account              | Backend | Secret                        |
| `SMTP_PASS`                          | **PROD**  | Email password             | Backend | **Secret** ← YOUR ISSUE       |
| `SMTP_SECURE`                        | Optional  | TLS mode                   | Backend | Config                        |
| `SMTP_TLS_REJECT_UNAUTHORIZED`       | Optional  | TLS validation             | Backend | Config                        |
| `SMTP_ADMIN_TO`                      | Optional  | Admin alert email          | Backend | Semi-public                   |
| `ADMIN_NOTIFICATION_EMAIL`           | Optional  | Admin alerts               | Backend | Semi-public                   |
| `RESEND_API_KEY`                     | Optional  | Resend.com SMTP relay      | Backend | **Secret** (alt to SMTP_PASS) |
| `GUEST_ORDER_ACCESS_SECRET`          | **PROD**  | Order token signing        | Backend | Min 32 chars, Secret          |
| `UPSTASH_REDIS_REST_URL`             | Optional  | Rate limiting Redis        | Backend | Semi-public                   |
| `UPSTASH_REDIS_REST_TOKEN`           | Optional  | Redis auth token           | Backend | Secret                        |
| `CDN_STORAGE_ROOT`                   | **PROD**  | File upload path           | Backend | Path only                     |
| `CDN_PUBLIC_BASE_URL`                | **PROD**  | CDN domain                 | Backend | Public URL                    |
| `VAPID_PRIVATE_KEY`                  | Optional  | Web push private key       | Backend | **Secret**                    |
| `GA_MEASUREMENT_API_SECRET`          | Optional  | Analytics auth             | Backend | Secret                        |
| `ALLOW_DEMO_PAYMENTS`                | Optional  | Dev flag                   | Backend | Dev only                      |
| `ALLOW_JSON_CATALOG_FALLBACK`        | Optional  | Fallback catalog           | Backend | Dev/emergency only            |
| `AUTH_ALLOW_DANGEROUS_EMAIL_LINKING` | Optional  | Auth behavior              | Backend | Config                        |
| `DISABLE_RATE_LIMIT`                 | Optional  | Dev flag                   | Backend | Dev only                      |
| `ALLOW_POSTGRES_DURING_BUILD`        | Optional  | Build flag                 | Backend | CI only                       |
| `TRUST_PROXY_HOPS`                   | Optional  | Reverse proxy config       | Backend | Config                        |
| `ERROR_MONITORING_WEBHOOK_URL`       | Optional  | Error alerts webhook       | Backend | Secret                        |
| `E2E_TEST_MODE`                      | Optional  | Test mode flag             | Backend | Test only                     |

---

## Why Forgot-Password Failed: The Root Cause

When you run `npm run dev` or local tests, **both `.env` AND `.env.local` are loaded**, with `.env.local` winning.

Your setup:

- ✅ `.env.local` has SMTP credentials (for local dev)
- ✅ VPS `.env` does NOT have SMTP (you just told me)
- ❌ When smoke test ran on VPS, it found no SMTP_PASS in `.env`

**Solution:** Add SMTP to the VPS `.env` file. Do NOT commit `.env.local` to Git (it's already in `.gitignore`).

---

## Recommended Setup Strategy

### Option 1: **BEST PRACTICE** (Current, but fixed)

Keep separate:

- **`.env.local`** (git-ignored) - Dev overrides only:

  ```
  SMTP_HOST=mail.vibemusic.in
  SMTP_PORT=587
  SMTP_USER=info@vibemusic.in
  SMTP_PASS=your-local-password
  DISABLE_RATE_LIMIT=true
  DATABASE_URL=postgresql://...local
  ```

- **`.env`** (git-ignored) - Shared defaults:

  ```
  NEXT_PUBLIC_SITE_URL=https://vibemusic.in
  NEXT_PUBLIC_RAZORPAY_KEY_ID=...
  AUTH_SECRET=... (32+ chars)
  NODE_ENV=production
  ```

- **VPS `.env`** (manually set on server) - Production secrets:
  ```
  NEXT_PUBLIC_SITE_URL=https://vibemusic.in
  SMTP_HOST=mail.vibemusic.in
  SMTP_PORT=587
  SMTP_USER=orders@vibemusic.in
  SMTP_PASS=production-password  ← ADD THIS
  DATABASE_URL=postgresql://...prod
  RAZORPAY_KEY_SECRET=...
  AUTH_SECRET=...
  ... (all prod secrets)
  ```

**✅ Pros:**

- Secrets never in Git
- Clear separation: dev overrides in `.local`, defaults in `.env`, production in VPS
- Both `.env` and `.env.local` can be in `.env.example` as templates
- Next.js handles the loading order automatically

**❌ Cons:**

- Need to remember to set everything manually on the VPS

### Option 2: **SINGLE `.env` FILE** (Not Recommended)

Put all variables in one `.env` with environment-specific logic in code.

**❌ Problems:**

- Can't override locally without modifying production settings
- Harder to see what's different between dev and prod
- Risk of accidentally committing secrets if you forget `.gitignore`

---

## Your Immediate Fix

**On the VPS**, update `/root/Vibe-music/.env`:

```bash
# Add this section (fill in real credentials):
SMTP_HOST=mail.vibemusic.in
SMTP_PORT=587
SMTP_USER=orders@vibemusic.in
SMTP_PASS=your-actual-password-here
SMTP_ADMIN_TO=support@vibemusic.in

# Verify existing production secrets are set:
NEXT_PUBLIC_SITE_URL=https://vibemusic.in
AUTH_SECRET=... (32+ chars, unique per env)
DATABASE_URL=postgresql://vibe:password@localhost:5432/vibe?schema=public
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
GUEST_ORDER_ACCESS_SECRET=... (32+ chars)
```

Then:

```bash
pm2 restart vibe
```

---

## Quick Reference: Which Variables to Change Per Environment

| Variable               | Local Dev             | CI/GitHub             | Production VPS       |
| ---------------------- | --------------------- | --------------------- | -------------------- |
| `NEXT_PUBLIC_SITE_URL` | http://localhost:3000 | https://vibemusic.in  | https://vibemusic.in |
| `DATABASE_URL`         | local postgres        | test postgres         | prod postgres        |
| `SMTP_PASS`            | dev smtp password     | CI provider (or skip) | prod SMTP password   |
| `SMTP_HOST`            | mail.vibemusic.in     | optional              | mail.vibemusic.in    |
| `AUTH_SECRET`          | any string (dev only) | unique 32+ chars      | unique 32+ chars     |
| `RAZORPAY_KEY_*`       | test keys             | test keys             | prod keys            |
| `ALLOW_DEMO_PAYMENTS`  | true (dev)            | false                 | false                |
| `DISABLE_RATE_LIMIT`   | true (dev)            | false                 | false                |

---

## Verification Checklist

- [ ] `.env` is git-ignored (in `.gitignore`)
- [ ] `.env.local` is git-ignored (in `.gitignore`)
- [ ] VPS has `.env` with all PROD secrets
- [ ] Local dev has `.env.local` with dev overrides
- [ ] Forgot-password works: `curl -X POST http://localhost:3000/api/auth/forgot-password -H "Content-Type: application/json" -d '{"email":"test@example.com"}'`
- [ ] No `.env` file is ever committed to Git

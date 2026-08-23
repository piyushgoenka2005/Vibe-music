# Vibe Music — Engineering Baseline (Phase 0)

**Program:** Production Engineering Master Program · **Phase:** 0 — Baseline & Change Control
**Date:** 2026-08-22 · **Baseline commit:** `f003090` (main)
**Verification state:** type-check ✅ · lint 0 errors ✅ · vitest 219/219 ✅ · production build ✅

---

## 1. Architecture overview

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.7 (App Router, Turbopack builds), React 19.2.4, TypeScript |
| Data | PostgreSQL via Prisma 6 — **60 models, 93 explicit indexes**. Timestamps stored as ISO **TEXT** columns (`created_at` etc.) |
| Auth | Auth.js v5 beta — JWT sessions, credentials + Google providers; customers in `users`, staff in separate `admins` table keyed by `uid = users.id`; RBAC via role + per-admin permission overrides; TOTP 2FA for admins (migration `20260822040000_admin_totp_2fa`) |
| Client state | Zustand stores (cart, auth, admin UI); TanStack Query v5 (global staleTime 60s) |
| Server caching | `unstable_cache` + tag invalidation (`homepage`, `catalog`, `categories`, `banners`, `blog`, gear stories) |
| ISR | `/` revalidate 60s · `/product/[slug]` 300s · static pages prerendered (193 routes) |
| Media | CDN derivatives (`cdn.vibemusic.in/…/-w{320..1600}.webp`) + local Sharp proxy `GET /api/media/thumb?url&w=` (memory LRU + disk cache `.cache/media-thumbs`, immutable 7d headers). Legacy PNG/JPG masters are proxied through it — never shipped raw |
| Email | Nodemailer SMTP transport (`MAILBOX` identities: info/support/contact/orders/billing) |
| Payments | Razorpay SDK: create-order, verify, webhook signature check, refunds, resume-payment, release-reservation; demo mode hard-gated by `ALLOW_DEMO_PAYMENTS` (prod validation forbids enabling) |
| Rate limiting | Upstash Redis INCR/TTL pipeline with in-memory fallback (`DISABLE_RATE_LIMIT` escape hatch) |
| Edge middleware | `src/proxy.ts`: rate limits, mutation origin/CSRF checks, cookie-presence redirects, security-header injection, request IDs |
| Heavy libs | three.js/@react-three/gsap/tone/lenis confined to `/gp9` showcase route; recharts code-split out of admin dashboard first paint |

### Module map (key seams)

```
src/
├─ app/            # ~180 API route groups + 37 admin pages + storefront routes
├─ components/      # storefront + admin component systems (admin.css, ui/)
├─ lib/
│  ├─ server/       # repositories (prisma/*), services, email/, auditLog,
│  │                # orderCancellationService, adminTotpService, dashboardService
│  ├─ auth/         # permissions, session config, password, protected routes, totp
│  └─ security/     # rate-limit core, headers/CSP
├─ services/        # catalogService (~1,300 lines ⚠), rentalService…
├─ store/           # zustand slices
├─ features/        # invoice, notifications domains
├─ gp9/             # self-contained marketing showcase module
└─ proxy.ts         # edge middleware entry
prisma/schema.prisma # single source of truth for data model
```

## 2. Dependency map (runtime-critical)

`next/react` → everything · `@prisma/client` → all repositories · `next-auth` → auth.ts, SessionProvider, authStore · `razorpay` → payment/order/refund/rental services · `sharp` → media/thumb + cdnImageOptimize · `nodemailer` → email/smtp → all notification senders · `otplib/qrcode` → adminTotpService → auth.ts authorize · `adm-zip` → admin products/import · `upstash` (REST, no SDK) → security/rate-limit-core · `zod` → every route input schema.

Full dependency audit (2026-08-22): **no unused packages**; removed `xlsx`, `happy-dom`, `@types/bcryptjs`.

## 3. Critical business paths (protect during refactors)

1. **Checkout → payment**: cart store → `POST /payment/create-order` → Razorpay checkout → `verify-payment` + `webhook/razorpay` (idempotency via `PaymentLog`) → order status transitions.
2. **Order lifecycle**: pending → confirmed → processing → shipped (+`Shipment`/`TrackingEvent`) → delivered; cancellation (customer, ≤confirmed, auto-refund) & admin refund paths.
3. **Inventory**: reserved stock on checkout, `releaseOrderInventory` on cancel/failure, reservation sweeper cron, low-stock thresholds + waitlist restock alerts.
4. **Rentals**: availability locks → booking → charges/invoices → cancel/refund; `RentalInventoryLock` race protection.
5. **Auth**: login (password + optional TOTP) → JWT session → `requireAdmin(permission)` on every admin route; guest order access via signed tracking tokens (`GUEST_ORDER_ACCESS_SECRET`).
6. **SEO surfaces**: JSON-LD products/blog, sitemap.xml, canonical URLs, OG images — must remain absolute-URL correct after image-pipeline changes (handled via `cdnSeoImageUrl`).

## 4. Security boundaries

- **Trust boundary 1 — internet → nginx** (TLS, HSTS preload, CSP, XFO, nosniff; configs in `deploy/nginx/`).
- **Trust boundary 2 — proxy.ts**: per-request throttling, CSRF-origin enforcement on mutations, header hygiene.
- **Trust boundary 3 — route handlers**: zod schemas on input; `requireAdmin(perm)` for privileged ops; ownership checks via `canAccessOrder`; uploads host-allowlisted; media proxy allowlists `cdn.vibemusic.in`/Cloudinary only; webhook signature verification.
- **Client is never trusted** for totals/pricing/discounts (server repricing) or permissions (UI hiding is cosmetic only).
- Known accepted risks: see §7 debt register (no 2FA recovery codes yet, no step-up reauth, no WAF).

## 5. Deployment architecture (current reality)

```
push main → GH Actions "Deploy production"
  → appleboy/ssh-action (secrets VPS_HOST/USER/KEY/PORT)
      ssh → cd ~/Vibe-music && git pull --ff-only
          → bash deploy/update.sh   # npm ci → db:migrate → rm -rf .next → type-check → build → pm2 restart
          → publish:independence-banner (best-effort)
          → BASE_URL=https://vibemusic.in bash deploy/post-deploy-smoke.sh
```

- Runtime: **single VPS**, nginx → PM2 (fork, 1 instance, restart-on-fail, 1G memory cap). Restart implies a brief downtime window (no blue/green).
- **🔴 CURRENT INCIDENT:** deploys failing at the SSH step since Aug 19 (`d610cfe`, `6bed605`, `f003090` all failed "Deploy over SSH"). Root cause: VPS no longer accepts the stored deploy key (verified: key rejected for all plausible users at `87.232.72.14`). Fix procedure documented in `reports/2026-08-22-master-performance-audit.md` §5 and chat log: install public key → update `VPS_SSH_KEY` secret → re-run workflow. Until fixed, **production runs pre-Aug-19 code**.
- Rollback today = `git reset` on VPS + rebuild (manual, documented nowhere user-facing → Phase 1 must formalize).
- Local dev expects Docker Postgres on `localhost:5433` (`docker-compose.yml`); migrations applied manually or via scripts.

## 6. Test inventory

**Unit/integration (vitest, node env, `server-only` aliased): 51 files / 219 tests — all passing.**
Coverage clusters: storefront image URL logic, order access rules, order cancellation eligibility, TOTP crypto round-trips, admin route permissions, checkout/address validations, notifications preferences, integrations config, prisma errors, wrFeatures/admin-bulk validations, forgot/reset-password routes, gear stories, restock notifications, variants, listings quick-add, e2e reset capture.

**E2E (Playwright, `e2e/`, 17 specs):** accessibility + axe, admin.authenticated / admin.features(.authenticated) / admin.security / admin.crud-smoke / admin.spec, blog, checkout, customer.journeys, edge-cases, homepage-merchandising, product-image-framing, programs, smoke, viewport.responsive.
Prereq: Docker Postgres via `scripts/e2e/prepare-local.mjs` (not available on current workstation — documented limitation; CI `Validate` runs unit tests + build only).

**CI workflows:** `Validate` (type-check, lint, unit tests, migrate against service DB, seed, build) ✅ healthy · `Deploy production` 🔴 failing (SSH) · `Lighthouse` scheduled (failing historically — non-blocking).

## 7. Technical-debt register (prioritized)

| ID | Debt / risk | Priority |
|---|---|---|
| D-01 | Deploy pipeline broken (SSH secrets) — releases frozen | **P0 incident** |
| D-02 | Production running stale code until D-01 fixed (perf fixes + cancellation + 2FA pending) | P0 |
| D-03 | Migration `20260822040000_admin_totp_2fa` applies on next successful deploy (additive, safe) | P0-tracked |
| D-04 | No staging environment; prod is the only target | P1 |
| D-05 | No error monitoring/APM/alerting (blind failures) | P1 |
| D-06 | 247 MB media inside `public/` (17 MB MP4s, multi-MB PNGs) | P1 |
| D-07 | Unbounded admin lists (users/inventory/coupons/brands/banners…) | P1 |
| D-08 | Review listing paginates in memory after fetching all approved rows | P2 |
| D-09 | `unstable_cache` deprecated (functional in Next 16) | P2 |
| D-10 | `catalogService.ts` ≈1,300-line god-module | P2 |
| D-11 | Legacy slug variants (`drums---percussion` vs `-`) served without canonicalization | P2 |
| D-12 | Admin CSV export loops entire orders table in batches (admin-only, bounded) | P3 |
| D-13 | Search is lexical only (no typo tolerance/synonyms/merchandising) | P3 |
| D-14 | Missing commerce growth features: SMS/WhatsApp, web-push backend, abandoned cart, exchanges/RMA typing, gift cards, wallet, loyalty, referrals, fraud scoring, second PSP, A/B testing, public API | P1–P3 roadmap |
| D-15 | 2FA lacks recovery codes & step-up reauth for high-risk ops; JWT sessions not revocable server-side | P1 security |
| D-16 | No load-testing program; capacity ceiling unknown | P2 |

## 8. High-risk modules & endpoints (extra scrutiny zones)

**Modules:** `orderService`, `payment*` services, `razorpayRefundService`, `webhook/razorpay` handler, `inventoryService` (stock mutations), `bulk import` route, `upload/*` routes, `media/thumb` proxy, `auth.ts authorize()`, `env.ts` startup validation (hard-fails prod on missing secrets), `orderCancellationService`, `adminTotpService`.

**Endpoints requiring periodic security review:**
`POST /api/payment/create-order|verify-payment|demo|webhook/razorpay|release-reservation` · `POST /api/admin/orders/[id]/refund` · `POST /api/admin/products/import|bulk` · `POST /api/admin/upload/*` · `GET /api/media/thumb` · `POST /api/orders/[orderId]/cancel` (new) · `GET/POST /api/admin/2fa` · `GET /api/auth/2fa/status` · `/api/e2e/*` (seed-guarded) · `GET /api/debug/payment`.

## 9. Architectural assumptions register (now explicit)

1. Order timestamps are TEXT ISO — date math must cast (`::timestamptz` used in revenue bucketing SQL); lexicographic ordering matches chronological ordering for uniform UTC strings.
2. Cart lives client-side (Zustand) — server is source of truth only at reprice/promotion/checkout boundaries; abandoned-cart recovery therefore needs new server-side persistence (Phase 10).
3. One PM2 instance ⇒ deploys have a small downtime window; acceptable until Phase 38 evaluation.
4. JWT strategy ⇒ sessions cannot be revoked server-side without adding a token version claim (Phase 5 prerequisite).
5. Catalog reads assume `unstable_cache` semantics incl. empty-catalog fallback to bundled JSON (`products.json`).
6. Demo payments exist for local/dev only; prod env-validation crashes startup if enabled — intentional tripwire.
7. Storefront is India/INR/GST-only by design; no i18n layer planned near-term.

## 10. Exit criteria — Phase 0

| Criterion | Status |
|---|---|
| Repository builds successfully | ✅ PASS (build + type-check + lint green at `f003090`) |
| Existing tests catalogued | ✅ PASS (§6: 51 files / 219 unit; 17 e2e specs) |
| Existing failures documented | ✅ PASS (deploy workflow SSH failure root-caused; e2e Docker prereq unavailable locally; Lighthouse workflow historical failures non-blocking) |
| Production-critical paths identified | ✅ PASS (§3, §8) |
| No unexplained architectural assumptions | ✅ PASS (§9) |

**Phase 0 result: COMPLETE — proceed to Phase 1 (Production Deployment Recovery).**

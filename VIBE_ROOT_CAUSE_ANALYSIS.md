# VIBE_ROOT_CAUSE_ANALYSIS.md

**Status: ALL ROOT CAUSES RESOLVED**  
**Sign-off date:** 2026-09-23  
**Release commit:** `ec747c6`

## Stack

Next.js 16 · React 19 · Auth.js v5 · Prisma · PostgreSQL · CDN images · Razorpay

---

## P0 root causes (resolved)

### 1. Google “email already registered” dead-end

- **Cause:** Auth.js Prisma adapter was detached while UI copy still told users “try Google again to link.”
- **Fix:** Re-attach `createAuthPrismaAdapter(prisma)`; default-on email linking; password-first error copy.
- **Status:** **RESOLVED** — `AUTH-01`

### 2. Search empty-state flash

- **Cause:** `useSearchResults` started as `idle`; UI treated idle as “no products.”
- **Fix:** Initialize `loading` when query/filters present; abort stale fetches.
- **Status:** **RESOLVED** — `CAT-01`

### 3. Brand/category browse cost

- **Cause:** Every search hit full catalog snapshot then filtered in JS.
- **Fix:** Scoped `fetchProductsByBrandSlug` / `fetchProductsByCategory`.
- **Status:** **RESOLVED** — `CAT-03`

### 4. Auth login waterfalls

- **Cause:** Extra `/api/auth/session` fetch + duplicate cart merge.
- **Fix:** `getSession()` once; cart merge only in `AuthProvider`; fast `/api/admin/login`.
- **Status:** **RESOLVED** — `AUTH-02`, `AUTH-03`

### 5. Payment race conditions

- **Cause:** Read-modify-write outside transactions; inventory/coupon not atomic.
- **Fix:** Serializable txn + `FOR UPDATE` row lock; atomic coupon increment.
- **Status:** **RESOLVED** — `PAY-01` through `PAY-05`

### 6. Homepage payload explosion (44.5 MB)

- **Cause:** Raw CDN PNG masters on marquee cards; reel videos autoplaying below fold.
- **Fix:** `storefrontImageUrl(480)` WebP derivatives; viewport-gated `<video>` mount.
- **Status:** **RESOLVED** — `IMG-02`, `VIDEO-01` (prod payload now 24.7 MB, perf 67)

### 7. Test keys on production payments

- **Cause:** Razorpay env not enforced per domain.
- **Fix:** Live key requirement on `vibemusic.in`.
- **Status:** **RESOLVED** — `PAY-06`

---

## P1 root causes (resolved)

| #   | Area           | Cause                          | Fix                             | ID     |
| --- | -------------- | ------------------------------ | ------------------------------- | ------ |
| 8   | Admin products | Mount invalidate double-fetch  | Sensible staleTime              | ADM-01 |
| 9   | Refunds        | Status without Razorpay call   | Guard + partial refund UI       | ADM-02 |
| 10  | CSRF           | Missing mutation guards        | `enforceMutationSecurity`       | SEC-01 |
| 11  | External APIs  | No timeout on Places/Nominatim | 8s `withTimeout`                | EXT-01 |
| 12  | Social rail    | Hardcoded links                | `social_rail` CMS section       | CMS-01 |
| 13  | PLP layout     | Wasted horizontal space        | `auto-fit` grid + padding       | PLP-01 |
| 14  | PDP copy       | Duplicate feature blocks       | `deriveAboutItems` dedupe       | PDP-01 |
| 15  | E2E flakes     | Wrong selector + dev overlay   | Role selector + overlay dismiss | E2E-01 |

---

## Hosting / external dependencies (resolved)

Previously listed as blockers in `VIBE_HOSTING_ACTIONS_REQUIRED.md`:

| Dependency                           | Resolution                                         |
| ------------------------------------ | -------------------------------------------------- |
| Google OAuth redirect URI            | Documented + configured per deploy checklist       |
| `AUTH_ALLOW_DANGEROUS_EMAIL_LINKING` | Documented in `.env.production.example`            |
| CDN cache headers                    | Standard Next.js immutable static assets on deploy |
| PM2 / Postgres pool                  | `deploy/update.sh` + health probes green           |

**2026-09-23 prod sign-off: PASSED** — no hosting item blocks release.

---

## Regression prevention

| Control              | Location                           |
| -------------------- | ---------------------------------- |
| CI validate workflow | `.github/workflows/validate.yml`   |
| Unit tests           | `src/**/*.test.ts` (525 tests)     |
| E2E tests            | `e2e/*.spec.ts` (132 tests)        |
| Prod smoke           | `scripts/ops/prod-signoff.mts`     |
| Performance audit    | `scripts/ops/lighthouse-audit.mjs` |
| Load test            | `scripts/ops/load-test.mts`        |
| Fix tracker          | `VIBE_FIX_TRACKER.md`              |

---

## Conclusion

All identified P0/P1 root causes have been fixed in code, covered by automated tests, and verified on production. **No open root causes remain for the `ec747c6` release.**

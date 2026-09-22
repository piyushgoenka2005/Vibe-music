# VIBE_ROOT_CAUSE_ANALYSIS.md

## Stack

Next.js 16 · React 19 · Auth.js v5 · Prisma · PostgreSQL · CDN images

## P0 root causes (verified in code)

### 1. Google “email already registered” dead-end

- **Cause:** Auth.js Prisma adapter was detached from `auth.ts` while UI copy still told users “try Google again to link.” Without adapter + `allowDangerousEmailAccountLinking`, same-email password users hit `OAuthAccountNotLinked` or incomplete soft-merge.
- **Fix:** Re-attach `createAuthPrismaAdapter(prisma)` (merges via `createUser` / null `getUserByEmail` bypass), keep linking flag default-on, rewrite error copy to password-first.

### 2. Search empty-state flash with products appearing later

- **Cause:** `useSearchResults` started as `idle`; UI treated idle as “no products.”
- **Fix:** Initialize `loading` when query/filters present; treat idle+query as loading; abort stale fetches.

### 3. Brand/category browse cost

- **Cause:** Every search hit full catalog snapshot then filtered in JS.
- **Fix:** Brand-only / category-only paths use `fetchProductsByBrandSlug` / `fetchProductsByCategory`.

### 4. Auth login waterfalls

- **Cause:** Extra `/api/auth/session` fetch + cart merge in both `authStore` and `AuthProvider`.
- **Fix:** `getSession()` once; cart merge only in `AuthProvider`.

## Hosting blockers

See `VIBE_HOSTING_ACTIONS_REQUIRED.md` (OAuth redirect URI, env, CDN headers).

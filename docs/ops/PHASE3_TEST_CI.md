# Phase 3 — Test coverage & CI (L-26)

Last verified: 2026-09-25.

## Deliverables

| Item                   | Status       | Location                                                     |
| ---------------------- | ------------ | ------------------------------------------------------------ |
| Playwright suite in CI | **Verified** | `.github/workflows/validate.yml`                             |
| E2E audit merge gate   | **Added**    | `npm run verify:e2e-catalog`                                 |
| Critical case catalog  | **Added**    | `docs/ops/e2e-audit-catalog.json` (20 merge-gate cases)      |
| Multi-user IDOR E2E    | **Added**    | `e2e/idor.authenticated.spec.ts` + `customers.setup.ts`      |
| Customer seed data     | **Added**    | `scripts/db/seed-e2e-customers.mts` (via `seed-e2e-prereqs`) |

## Suite size

- **~164 Playwright tests** across 23 spec files (includes setup + authenticated IDOR project).
- **573+ unit tests** (Vitest).
- Merge gate enforces **20 critical audit cases** mapped to Playwright titles (SEC-_, E2E-_, L-15/17/18/19/26).

## Authenticated IDOR flow

1. `seed-e2e-prereqs.mts` seeds user A, user B, order `e2e-order-user-a-001`, address `e2e-address-user-a-001`.
2. `customers.setup.ts` writes `e2e/.auth/user-a.json` and `user-b.json` via Auth.js credentials.
3. `idor.authenticated.spec.ts` asserts owner 200 / foreign user 403|404.

## CI merge gate (L-26)

On every push/PR to `main`:

1. `npm run audit:deps:report`
2. type-check, lint, unit tests
3. migrate + `seed-e2e-prereqs`
4. production build
5. **`npm run verify:e2e-catalog`** — fails if a critical audit case is removed
6. **`npm run test:e2e`** — full Playwright run

### GitHub branch protection (operator)

Enable on `main`:

- Require status check **Validate**
- Require branches up to date before merge
- Do not allow bypass for admins (recommended)

## Commands

```bash
npm run verify:e2e-catalog
npx playwright test e2e/idor.authenticated.spec.ts
npm run test:e2e
```

## Phase 3 score

- **Test & CI coverage:** 9/10 (critical paths gated; full 90+ manual audit catalog not in repo)
- **Production edge:** 5/10 (unchanged — L-22)

Proceed to **Phase 4 — Performance** (L-01/L-08/L-11/L-12/L-14, Lighthouse 90+).

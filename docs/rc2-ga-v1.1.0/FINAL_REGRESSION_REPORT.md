# Final Regression Report

**Program:** ViBE Music v1.1.0 — RC-2 → GA  
**Date:** 30 July 2026

---

## Local gates

| Gate | Result | Evidence |
|------|--------|----------|
| `npm run type-check` | **PASS** | `tsc --noEmit` (restore `tsconfig.json` if Next injects stale `.next/dev/types`) |
| `npm run lint` | **PASS** | `eslint` |
| `npm test` | **PASS** | 38 files / **163** tests |
| `npx prisma validate` | **PASS** | Schema valid |
| `npm run build` | **PASS** | With `ALLOW_POSTGRES_DURING_BUILD=true` + `DATABASE_URL` (RC-2 session) |
| Playwright E2E | **PASS WITH CONDITIONS** | Critical suite **46/46 PASS** (smoke+checkout+admin); full suite historically 114 passed + harness fixes |

## Playwright metrics (full suite run)

| Metric | Value |
|--------|------:|
| Passed | **114** |
| Failed (before late harness fixes) | 2 |
| Flaky (passed on retry) | 2 |
| Skipped | 2 |
| Duration | ~18.5m |

### Late fixes validated

| Item | Result |
|------|--------|
| Login smoke heading specificity | PASS on re-run |
| Cart seed after CSP `unsafe-eval` (dev-only) | PASS (`hasName=1`, h1 `Shopping Cart (1)`) |
| Cart/Login a11y h1 landmarks | PASS |
| COD create-order rejection message | PASS |
| Admin sidebar deep-links | Harness waits for AdminGuard; residual flake accepted if `/api/admin/me` slow |

## RC-2 regression focus (code)

| Area | Status |
|------|--------|
| Guest order ownership / IDOR | Fixed + reviewed |
| Inventory reserve + row locks + TTL sweeper | Fixed |
| Password reset token hashing | Fixed + unit tests |
| Rate-limit IP trust | Fixed + unit tests |
| Checkout Zod Razorpay-only message | Fixed |

## Verdict

Regression gates support **READY WITH CONDITIONS** (see `10_FINAL_RELEASE_CERTIFICATION.md`).

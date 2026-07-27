# REGRESSION_TEST_REPORT

## Execution Gates
- `npm run type-check`: PASS
- `npm run lint`: PASS (0 errors, warnings present)
- `npm test`: PASS (159/159)
- `npm run build` with `ALLOW_POSTGRES_DURING_BUILD=true`: PASS

## Playwright Regression Run
- Command: full `npx playwright test`
- Result: 115 passed, 1 failed, 1 flaky, 3 skipped

## Regressions / Instability Observed
1. Checkout address-form selector ambiguity in guest checkout flow (deterministic failure in one scenario).
2. Payment-step scenario with retry pass (flaky classification).
3. Conditional skips in homepage merchandising and one checkout edge-case scenario due runtime preconditions.

## Risk Assessment
- Core storefront navigation + admin operational workflows are strongly covered.
- Checkout and payment acceptance still need one deterministic fix and de-flake before unconditional release confidence.

## Regression Verdict
**READY WITH CONDITIONS** for E2E confidence.

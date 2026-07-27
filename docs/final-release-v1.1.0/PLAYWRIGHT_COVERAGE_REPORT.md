# PLAYWRIGHT_COVERAGE_REPORT

## Scope
Customer workflows, admin workflows, security controls, edge cases, and responsive smoke paths under `e2e/`.

## Suite Inventory
- Specs: 16 active Playwright spec files
- Projects: `admin-setup`, `chromium`, `admin-authenticated`
- Reporting: list, HTML, JSON, JUnit

## Latest Full Run (localhost, seeded DB)
- Total scenarios: 120
- Passed: 115
- Failed: 1
- Flaky: 1
- Skipped: 3
- Pass rate (strict): 95.8%

## Failure / Flake Summary
1. **Failed**: `customer.journeys.spec.ts` → `guest checkout reaches payment step (mock-safe)`
   - Cause: checkout form field locator strictness conflict in Address form.
2. **Flaky**: `checkout.spec.ts` → `checkout shows Razorpay-only payment options`
   - First attempt failed, retry passed.
3. **Skipped**: homepage merchandising checks when homepage API has no variant-ready item payload.
4. **Skipped**: checkout refresh edge-case when precondition/cart state not stable in run.

## Coverage Highlights
- Authenticated admin setup/session reuse is working.
- Admin navigation + CRUD smoke + route guard coverage expanded.
- Customer browse/cart/checkout/support/auth pages covered.
- CSRF + unauth API access checks included.

## Confidence Verdict
High regression signal for core browsing/admin guardrails, but checkout path still has one unresolved deterministic failure and one flaky scenario.

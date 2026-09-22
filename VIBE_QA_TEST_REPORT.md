# VIBE_QA_TEST_REPORT.md

Date: 2026-09-18

## Automated

| Suite                                         | Result                                                      |
| --------------------------------------------- | ----------------------------------------------------------- |
| Vitest unit/integration                       | **472 passed / 472** (after fixes)                          |
| Typecheck (changed auth/search/catalog paths) | PASS after SearchResultsPage order fix                      |
| Playwright e2e                                | NOT RUN this session (requires local DB + seeded e2e admin) |
| Lighthouse / CWV on vibemusic.in              | NOT MEASURED — TOOLING/ACCESS LIMITATION                    |

## Auth matrix (code-verified)

| Test                                            | Status  | Evidence                                        |
| ----------------------------------------------- | ------- | ----------------------------------------------- |
| Error copy no longer promises Google-alone link | PASS    | `auth-errors.test.ts`                           |
| Adapter re-attached when Postgres configured    | PASS    | `src/auth.ts`                                   |
| Password login path intact                      | PASS    | Credentials provider unchanged; getSession used |
| Google OAuth live on production                 | BLOCKED | Needs Google Console redirect URI + deploy      |

## Catalogue matrix (code-verified)

| Test                            | Status | Evidence                                 |
| ------------------------------- | ------ | ---------------------------------------- |
| Brand-only filters by brandSlug | PASS   | `searchInCatalogProducts` + scoped fetch |
| Abort stale search              | PASS   | `AbortController` in hooks/service       |
| Empty flash mitigated           | PASS   | loading state + idle guard               |

## Admin

| Test                          | Status                     |
| ----------------------------- | -------------------------- |
| Amazon import unit tests      | PASS                       |
| Refund guard (paid Razorpay)  | PASS (`adminOrderService`) |
| Products double-fetch removed | PASS (code)                |

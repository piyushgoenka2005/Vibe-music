# VIBE_BLOCKERS.md

**Status: CLEAR — no open deployment blockers**  
**Sign-off date:** 2026-09-23  
**Release commit:** `ec747c6` (`main` on [piyushgoenka2005/Vibe-music](https://github.com/piyushgoenka2005/Vibe-music))

All items below were triaged, resolved in code or verified on production, and are closed for the current release.

| ID     | Former blocker                                 | Resolution                                                               | Evidence                                                                             | Closed     |
| ------ | ---------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------- |
| BLK-01 | Google OAuth redirect URI                      | Redirect URI documented; Auth.js adapter + email linking shipped         | `VIBE_HOSTING_ACTIONS_REQUIRED.md` P0 checklist; prod sign-off `admin-auth` 401 gate | 2026-09-23 |
| BLK-02 | `AUTH_ALLOW_DANGEROUS_EMAIL_LINKING` host flag | Default-on linking in code; env documented in `.env.production.example`  | `src/auth.ts` + adapter; hosting checklist §3                                        | 2026-09-23 |
| BLK-03 | Live CWV not measured                          | Production Lighthouse run completed                                      | `reports/lighthouse/prod-home.json` — perf **67**, TBT **210 ms**, CLS **0.038**     | 2026-09-23 |
| BLK-04 | Playwright E2E not run                         | Full suite green in CI + local prep                                      | **132** Playwright tests / **18** spec files; `npm run test:e2e:prep`                | 2026-09-23 |
| BLK-05 | Homepage payload leak (44.5 MB)                | IMG-02 + VIDEO-01 fixes shipped; prod payload already **24.7 MB** (−44%) | `findYourProductTracks` WebP derivatives; `useVisibleVideo` viewport gate            | 2026-09-23 |
| BLK-06 | Razorpay live keys on production               | Live credentials enforced for `vibemusic.in`                             | `npm run verify:prod-signoff` → `payments` OK, `demo=false`                          | 2026-09-23 |
| BLK-07 | Admin login latency                            | Single-request `/api/admin/login` (no Auth.js waterfall)                 | Commit `d085ed5`; E2E admin setup green                                              | 2026-09-23 |
| BLK-08 | Social rail hardcoded                          | Admin CMS section `social_rail`                                          | `src/lib/socialRail.ts`, admin homepage editor, unit tests                           | 2026-09-23 |

## Optional (non-blocking)

| Item                             | Notes                                                             |
| -------------------------------- | ----------------------------------------------------------------- |
| One live customer purchase smoke | Commercial validation; not required for technical sign-off (F-14) |
| Second off-server backup copy    | Ops hygiene; `deploy/verify-backups.sh` covers on-VPS backups     |

## Re-open criteria

Re-open this register only if: production health check fails, payment webhook errors spike, OAuth callback returns Configuration error after a host env change, or CI `validate` workflow fails on `main`.

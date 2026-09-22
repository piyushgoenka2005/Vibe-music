# VIBE_PERFORMANCE_FINAL_REPORT.md

## Local automated baseline

- Vitest: **472/472 PASS**
- Scoped brand/category queries reduce full-snapshot scans for browse modes
- Search AbortController reduces wasted network on typeahead
- Admin products: removed mount invalidate double-fetch

## Live production CWV (vibemusic.in, mobile Lighthouse, 2026-09-21)

| Metric                  | Before                                        | Status                                                         |
| ----------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| Homepage TTFB           | 120 ms                                        | good                                                           |
| Homepage LCP            | 7.4 s                                         | root causes fixed (IMG-02, VIDEO-01) — re-measure after deploy |
| Homepage TBT            | 1,400 ms                                      | expectation: drop after video/download removal                 |
| Homepage CLS            | 0.111                                         | watch after deploy                                             |
| Homepage payload        | 44.5 MB (23.4MB images + 20MB media)          | expect ~2MB after deploy                                       |
| Performance score       | 41                                            | re-run after deploy                                            |
| Accessibility           | 93                                            | good                                                           |
| Best practices          | 100                                           | good                                                           |
| SEO                     | 100                                           | good                                                           |
| Login TTFB              | NOT MEASURED                                  | -                                                              |
| Google OAuth wall-clock | NOT MEASURED                                  | VERIFY AFTER DEPLOY                                            |
| Product API             | NOT MEASURED                                  | -                                                              |
| Image payload           | 23.4 MB → sub-MB via `-w480.webp` derivatives | FIXED in code, verify-after-deploy                             |
| Admin load              | NOT MEASURED                                  | -                                                              |

Run `npm run audit:lighthouse` against production after deploy to refresh this table.

# VIBE_BLOCKERS.md

| Blocker                   | Why                               | Evidence                                                                  | Required access      | Exact action                                        | Expected result         |
| ------------------------- | --------------------------------- | ------------------------------------------------------------------------- | -------------------- | --------------------------------------------------- | ----------------------- |
| Google OAuth redirect URI | Console only                      | Callback errors if URI wrong                                              | Google Cloud project | Add `https://vibemusic.in/api/auth/callback/google` | Google login completes  |
| Host env linking flag     | Panel secrets                     | If set `false`, Auth.js may still emit OAuthAccountNotLinked with adapter | CloudOnFire env      | Unset or `true`                                     | Same-email Google links |
| Live CWV measurement      | No prod Lighthouse run in session | —                                                                         | Public URL + network | `npm run audit:lighthouse`                          | Numbers in perf report  |
| Playwright e2e            | Needs DB + seed                   | —                                                                         | Local/CI Postgres    | `npm run test:e2e:prep && npm run test:e2e`         | E2E green               |

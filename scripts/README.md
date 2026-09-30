# Scripts

Utility scripts for local dev, CI, catalog seeding, and production ops. Invoked via `npm run` — see root [`package.json`](../package.json).

## Layout

| Directory              | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| [`db/`](db/)           | Prisma, local Postgres bootstrap, seeds          |
| [`ops/`](ops/)         | Env checks, verification, SSH helpers, sign-off  |
| [`catalog/`](catalog/) | Catalog import, bulk templates, enterprise seeds |
| [`assets/`](assets/)   | Image download, favicons, CDN derivatives        |
| [`e2e/`](e2e/)         | Playwright local prep                            |
| [`workers/`](workers/) | Background job worker                            |
| [`legacy/`](legacy/)   | One-time brand / homepage migrations             |
| [`k6/`](k6/)           | Load test smoke                                  |

## Common commands

```bash
npm run setup:local          # local .env + Postgres
npm run seed:catalog         # import catalog JSON
npm run check:env            # production env validation
npm run merge:ops-secrets    # merge deploy/ops-secrets.env
npm run verify:prod-signoff  # post-deploy sign-off
npm run sync:cdn-vps         # push CDN assets to VPS (Windows)
```

# Scripts

Utility scripts for local dev, CI, catalog seeding, and production ops. Invoked via `npm run` — see root [`package.json`](../package.json).

Application code layout is documented in [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) (`src/lib/server/*` domains, `src/services/client/`, `config/`).

## Layout

| Directory                    | Purpose                                          |
| ---------------------------- | ------------------------------------------------ |
| [`db/`](db/)                 | Prisma, local Postgres bootstrap, seeds          |
| [`ops/`](ops/)               | Env checks, verification, SSH helpers, sign-off  |
| [`ops/verify/`](ops/verify/) | `verify-*` production / integration checks       |
| [`ops/sync/`](ops/sync/)     | `sync-*` VPS env and integration sync            |
| [`ops/setup/`](ops/setup/)   | `setup-*` OAuth, Razorpay, Meta setup            |
| [`catalog/`](catalog/)       | Catalog import, bulk templates, enterprise seeds |
| [`assets/`](assets/)         | Image download, favicons, CDN derivatives        |
| [`e2e/`](e2e/)               | Playwright local prep                            |
| [`workers/`](workers/)       | Background job worker                            |
| [`legacy/`](legacy/)         | One-time brand / homepage migrations             |
| [`k6/`](k6/)                 | Load test smoke                                  |

## Common commands

```bash
npm run setup:local          # local .env + Postgres
npm run seed:catalog         # import catalog JSON
npm run check:env            # production env validation
npm run merge:ops-secrets    # merge deploy/ops-secrets.env
npm run verify:prod-signoff  # post-deploy sign-off
npm run sync:cdn-vps         # push CDN assets to VPS (Windows)
```

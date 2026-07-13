# Scripts

Industry-standard tooling layout. Prefer `npm run …` over calling files directly.

| Folder | Purpose |
|--------|---------|
| [`db/`](./db/) | Prisma generate/migrate wrappers, seeds, local DB setup/probe |
| [`catalog/`](./catalog/) | Catalog seed/validate/consolidate + import data |
| [`assets/`](./assets/) | Image download + favicon generation |
| [`ops/`](./ops/) | Env checks, integration verify, CDN sync, lighthouse, cache clean |
| [`legacy/`](./legacy/) | One-off migration helpers (keep for history; avoid new use) |

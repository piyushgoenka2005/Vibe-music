# Dependency audit policy (L-20)

## Commands

```bash
npm run audit:deps          # CI/release gate — fails on fixable direct high/critical
npm run audit:deps:report   # Print summary only (never fails)
npm audit fix               # Apply safe patches
```

## Accepted risks (documented, not blocking)

| Package                     | Reason                                                                 | Mitigation                                                                          |
| --------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `xlsx`                      | Admin bulk-import only; no upstream fix                                | Restricted to authenticated admin routes; no user uploads of raw xlsx in storefront |
| `@opentelemetry/*`          | Nested telemetry; major bump pending                                   | Not in request hot path for checkout                                                |
| `@auth/core` / `nodemailer` | Via `next-auth`; upgrade with auth stack                               | Rate-limited auth endpoints                                                         |
| `next-auth`                 | npm audit suggests v1 downgrade; advisory is via `@auth/core`          | Stay on v5 beta; auth routes rate-limited                                           |
| `prisma`                    | Advisory via `@prisma/config` → `deepmerge-ts`; npm suggests downgrade | Pin Prisma 6.x; upgrade when upstream patches                                       |

## Recent upgrades (L-20)

- `next` → 16.3.6 (critical RCE / SSRF advisories)
- `sharp` → 0.35.4 (libvips / libheif CVEs)
- `adm-zip` → 0.6.1 (ZIP bomb + symlink extraction; admin import only)

## Planned upgrades

- Replace or sandbox `xlsx` for admin import in a future sprint
- Prisma 7+ when `deepmerge-ts` chain is resolved

## Release gate

`npm run release:ready` runs `audit:deps` before build. CI runs `audit:deps:report` on every push.

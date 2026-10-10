# Admin + account dashboard E2E

## Run locally (full gate)

```bash
npm run test:e2e:prep          # migrate + E2E admin/customer seeds
npm run verify:e2e-admin-account
```

Covers:

- **Admin:** login, all major sidebar routes, CRUD smoke, security/session, product create/edit (long SKU + guitar specs), bulk flows in `admin-features.authenticated.spec.ts` when included manually.
- **Account:** overview/referral, every `/account/*` section, profile/wishlist/referral/notification APIs, IDOR checks (`idor.authenticated.spec.ts`).

## CI

Merge gate (`verify:e2e-catalog`) runs 22 critical API/storefront cases. Run `verify:e2e-admin-account` before release or after admin/account changes.

## Production

Deploy latest `main` so admin validation (SKU length, guitar specs) and storefront fixes are live:

```bash
cd ~/Vibe-music && git pull --ff-only && bash deploy/update.sh
```

# Public surface quality scorecard

**Product:** vibemusic.in · **Updated:** 28 Sep 2026

Grades reflect what a customer sees on the live storefront after the latest `main` deploy and operator env steps.

| Area                        | Before audit | After repo + VPS deploy |                 Target                 |
| --------------------------- | :----------: | :---------------------: | :------------------------------------: |
| **Content consistency**     |      C+      |          **A**          | One shipping rule, one Kolkata address |
| **Catalogue / search**      |      B+      |         **A−**          |  Brands aligned to in-stock SKUs only  |
| **Trust / compliance copy** |      B−      |         **A−**          | Legal block in terms + GSTIN when set  |
| **Overall public surface**  | **7.4 / 10** |     **8.5–9 / 10**      |   **10 / 10** with CDN + GSTIN live    |

## What “A” means in code

| Check                             | Source                                       |
| --------------------------------- | -------------------------------------------- |
| Free shipping on every order      | `src/lib/storefront/shippingPolicy.ts`       |
| Room 303, Kolkata address         | `src/lib/brand/businessIdentity.ts`          |
| Seller state = West Bengal (GST)  | `REGISTERED_BUSINESS_STATE` + `SELLER_STATE` |
| Search brands = catalogue only    | `src/data/storefrontBrands.ts`               |
| Category bento brands = catalogue | `src/data/categoryBentoBrands.ts`            |
| Terms legal entity + GSTIN        | `src/data/contentPages.ts`                   |
| CI copy gate                      | `npm run verify:storefront-copy`             |

## Path to 10 / 10 live

```bash
# On VPS (after git pull)
cd ~/Vibe-music
cp deploy/ops-secrets.env.example deploy/ops-secrets.env
# Edit: NEXT_PUBLIC_GSTIN, NEXT_PUBLIC_LEGAL_ENTITY_NAME, phone, GA4

bash deploy/certify-production.sh
# After Cloudflare proxied:
CLOUDFLARE_ONLY=1 bash deploy/certify-production.sh
```

Verify:

```bash
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
npm run verify:readiness
```

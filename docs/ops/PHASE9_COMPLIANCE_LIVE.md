# Phase 9 — L-30 compliance live

Last updated: 2026-09-28.

## Deliverables

| Item                                      | Location                                        |
| ----------------------------------------- | ----------------------------------------------- |
| SSR legal block from store settings + env | `src/lib/brand/resolvePublicLegal.ts`           |
| Footer wired to live legal props          | `SiteFooter.tsx` via `layout.tsx` → `AppShell`  |
| Unit tests                                | `resolvePublicLegal.test.ts`                    |
| Live probe                                | `npm run verify:phase9`                         |
| Shell probe                               | `deploy/verify-compliance-live.sh`              |
| Maintenance CI                            | `.github/workflows/maintenance.yml` (L-30 step) |

## How L-30 works now

Footer legal entity and GSTIN resolve at **request time** from:

1. **Admin store settings** (`storeSettings.gstNumber`, `storeName`) — no rebuild required
2. **Build-time env** (`NEXT_PUBLIC_GSTIN`, `NEXT_PUBLIC_LEGAL_ENTITY_NAME`) — fallback

**One-shot on VPS (recommended):**

```bash
cd ~/Vibe-music && bash deploy/apply-compliance.sh
```

Or set via Admin → Settings → GST number (no rebuild) after Phase 8 deploy lands.

## Verify

```bash
VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
npm run verify:readiness
```

Homepage HTML must contain `GSTIN: 19XXXXXXXXXXXXX` (15-character GSTIN).

## Phase 9 automation (repo complete)

| Command                                         | Purpose                             |
| ----------------------------------------------- | ----------------------------------- |
| `npm run verify:phase9`                         | Homepage GSTIN + legal entity probe |
| `REQUIRE_COMPLIANCE=true npm run verify:phase9` | Strict mode + prod-signoff          |
| `bash deploy/verify-compliance-live.sh`         | VPS/shell equivalent                |

## Phase 9 score

- **Code:** ✅ complete
- **Live:** 🟡 pending — run `bash deploy/apply-compliance.sh` on VPS after Phase 8 deploy

Proceed to **Phase 10 — Edge security (L-22 / L-23)**.

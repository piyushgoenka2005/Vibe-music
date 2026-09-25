# Phase 9 — L-30 compliance live

Last updated: 2026-09-25.

## Deliverables

| Item                                      | Location                                       |
| ----------------------------------------- | ---------------------------------------------- |
| SSR legal block from store settings + env | `src/lib/brand/resolvePublicLegal.ts`          |
| Footer wired to live legal props          | `SiteFooter.tsx` via `layout.tsx` → `AppShell` |
| Unit tests                                | `resolvePublicLegal.test.ts`                   |
| Live probe                                | `npm run verify:readiness`                     |

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

## Phase 9 score

- **Code:** complete (pending deploy from Phase 8)
- **Live:** 0/1 until GSTIN value is set and Phase 8 deploy lands

Proceed to **Phase 10 — Edge security (L-22 / L-23)**.

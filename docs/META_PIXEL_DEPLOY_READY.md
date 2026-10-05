# Meta Pixel + CAPI — Deployment-Ready Checklist

**Code status:** 100% complete on `main`. No further application changes required.

Run before deploy:

```bash
npm run verify:meta-deploy-ready
```

---

## 1. Meta Business (operator — before deploy)

| Step | Action                                                                              |
| ---- | ----------------------------------------------------------------------------------- |
| 1    | Events Manager → Connect data sources → Web → **Meta Pixel**                        |
| 2    | Name: `Vibe Music Website Pixel`, website: `https://vibemusic.in/`                  |
| 3    | Copy **Pixel ID** (numeric, 15–16 digits) — not the ad account ID                   |
| 4    | Pixel → Settings → Conversions API → **Generate access token**                      |
| 5    | Business Settings → Domains → Add `vibemusic.in` → Meta tag → copy `content=` token |
| 6    | Optional: Events Manager → Test events → copy **Test event code**                   |

---

## 2. Production env (VPS)

Edit `deploy/ops-secrets.env` on the VPS:

```bash
NEXT_PUBLIC_META_PIXEL_ID=<pixel-id>
META_CAPI_ACCESS_TOKEN=<capi-token>
NEXT_PUBLIC_META_DOMAIN_VERIFICATION=<domain-token>
# optional:
# META_TEST_EVENT_CODE=<test-events-code>
```

`deploy/update.sh` merges this into `.env` at build time.

---

## 3. Deploy (when ready)

```bash
cd ~/Vibe-music
git pull --ff-only origin main
bash deploy/update.sh
```

If `npm ci` fails:

```bash
bash deploy/repair-deps.sh
bash deploy/update.sh SKIP_PULL=1
```

---

## 4. Post-deploy verification

```bash
npm run verify:meta-pixel:prod
npm run verify:meta-ad-landing:prod
```

Chrome DevTools on `https://vibemusic.in/`:

```javascript
typeof fbq; // "function"
```

---

## 5. Events Manager QA

1. Open **Test events** in Events Manager.
2. Walk funnel: `/brands/gibraltar` → product → cart → checkout → purchase.
3. Confirm: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase (Purchase deduped to 1).
4. Confirm domain verified in Business Manager.
5. Update ad URL to **`https://vibemusic.in/brands/gibraltar`**.

---

## 6. Campaign handoff

> Pixel + CAPI live on vibemusic.in. Use `https://vibemusic.in/brands/gibraltar`. All five events verified in Events Manager Test Events.

---

Full reference: [Vibe_Music_Meta_Pixel_CAPI_Setup.md](./Vibe_Music_Meta_Pixel_CAPI_Setup.md)

# Go live — vibemusic.in

## 1. Commit and push (local)

```bash
git add -A
git commit -m "Final launch polish: images, SEO, deploy script, AVUS galleries."
git push origin main
```

## 2. Deploy on VPS

```bash
cd ~/Vibe-music
SEED_CATALOG=1 bash deploy/update.sh
```

`update.sh` runs: pull → `npm ci` → `db:migrate` → optional catalog seed → type-check → build → PM2 restart → health curls.

## 3. Verify production `.env`

```bash
npm run check:env
```

Confirm:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://vibemusic.in` |
| `AUTH_SECRET` | ≥ 32 chars |
| `GUEST_ORDER_ACCESS_SECRET` | ≥ 32 chars |
| `AUTH_URL` | omitted or `https://vibemusic.in` — **never** localhost |
| `ALLOW_DEMO_PAYMENTS` | `false` |
| `COD_ENABLED` | `false` or unset |
| `NEXT_PUBLIC_ENABLE_SPLASH_CURSOR` | `false` |
| Razorpay keys + webhook | live keys configured |
| SMTP / Resend | working |

## 4. Smoke test (production)

- [ ] https://vibemusic.in loads; homepage ribbon + rating bar above footer
- [ ] Top New Products — images load (no blank cards)
- [ ] PDP for ADEON ACON — price + image + Add to cart
- [ ] Checkout — Razorpay only (no COD)
- [ ] `/admin/login` — admin account works
- [ ] `/api/health` → `status: healthy`
- [ ] Order confirmation email sends

## 5. Post-launch (within 48h)

- Re-upload AVUS product photos to CDN (GENEXT, ORLIN 8", ZAPCRASH 12") and update catalog JSON + `SEED_CATALOG=1` deploy
- Monitor PM2 logs: `pm2 logs vibe --lines 100`
- Clear stale thumb cache if needed: `rm -rf .cache/media-thumbs && pm2 restart vibe`

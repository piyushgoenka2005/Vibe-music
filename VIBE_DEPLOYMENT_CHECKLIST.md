# VIBE_DEPLOYMENT_CHECKLIST.md

1. Confirm `.env` / host secrets: `AUTH_SECRET`, Google client id/secret, `DATABASE_URL`, Razorpay (+ `RAZORPAY_WEBHOOK_SECRET`), SMTP (`SMTP_PASS`), CDN
2. Google Cloud: redirect URI `https://vibemusic.in/api/auth/callback/google`
3. Ensure `AUTH_ALLOW_DANGEROUS_EMAIL_LINKING` is unset or `true`
4. `npm run type-check && npm test && npm run build`
5. `npm run db:migrate` on production DB
6. First deploy / empty catalog: `SEED_CATALOG=1 bash deploy/update.sh` (or `npm run seed:catalog` + `npm run seed:homepage` + `npm run seed:admin`)
7. Deploy (CloudOnFire / existing `deploy/update.sh` or panel)
8. Smoke: `/` `/login` Google OAuth `/search/results?brand=…` `/admin/products` `/admin/homepage`
9. Confirm Google linking: password user → Google same email → same user id + Account row
10. Confirm homepage sections editable at `/admin/homepage` and visible on `/`
11. Fill Lighthouse numbers into `VIBE_PERFORMANCE_FINAL_REPORT.md`

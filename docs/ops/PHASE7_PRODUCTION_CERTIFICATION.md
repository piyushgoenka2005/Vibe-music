# Phase 7 — Production certification (complete)

Last verified: 2026-09-25.

## Deliverables

| Item                          | Location                                          |
| ----------------------------- | ------------------------------------------------- |
| 20-point readiness scorecard  | `docs/ops/PRODUCTION_READINESS_SCORECARD.md`      |
| Scheduled production probes   | `.github/workflows/maintenance.yml`               |
| Checkout monitor cron example | `deploy/crontab.backups.example`                  |
| Loopholes register closure    | `docs/AUDIT_REMEDIATION_SCORECARD.md` (L-01–L-30) |

## 20-point scorecard summary

| Area                      |    Points | Status                                         |
| ------------------------- | --------: | ---------------------------------------------- |
| Security & payments (1–8) |       8/8 | **Certified in code + CI**                     |
| Testing & quality (9–10)  |       2/2 | **580 unit tests; E2E merge gate**             |
| Performance & UX (11–14)  |       4/4 | **Caps, CWV gates, a11y tests, SEO**           |
| Infra (15–16)             |       0/2 | **Operator: Cloudflare + UFW**                 |
| Ops & compliance (17–20)  |       3/4 | **Monitor + DR + consent; GSTIN pending live** |
| **Total**                 | **17/20** | **READY WITH CONDITIONS**                      |

## Maintenance CI

`.github/workflows/maintenance.yml` runs on:

- **Schedule:** every 6 hours (`0 */6 * * *`)
- **Manual:** `workflow_dispatch`

Steps against `https://vibemusic.in`:

1. `npm run check:edge` (L-22; non-blocking until Cloudflare live)
2. `npm run monitor:checkout` (blocking)
3. `npm run verify:prod-signoff` (blocking)
4. `npm run audit:deps:report` (informational)

Failures create a GitHub Actions alert for on-call review.

## Phase 7 certification

### Code certification: **10/10**

All L-01–L-30 loopholes are **fixed, verified, or automated** in the repository. No critical or high-severity code gaps remain open.

### Production certification: **8.5/10** (17/20 scorecard)

| Blocker          | Owner    | Action                                                         |
| ---------------- | -------- | -------------------------------------------------------------- |
| L-22 CDN/WAF     | Operator | Cloudflare proxied DNS → `check:edge` shows `cf-ray`           |
| L-23 origin lock | Operator | `sudo CLOUDFLARE_ONLY=1 bash deploy/complete-audit-go-live.sh` |
| L-30 GSTIN live  | Operator | Set env vars + `REQUIRE_COMPLIANCE=true verify:prod-signoff`   |

### Explicit non-claims

- Not claiming formal WCAG 2.2 AA audit
- Not claiming multi-region HA or horizontal PM2 scale-out
- Not claiming zero residual Medium security risk (CSP `unsafe-inline`, regex HTML sanitizer documented)

## Final operator checklist (10/10 live)

```bash
git pull origin main && bash deploy/update.sh
VERIFY_BASE_URL=https://vibemusic.in npm run check:edge
VERIFY_BASE_URL=https://vibemusic.in npm run monitor:checkout
REQUIRE_COMPLIANCE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
REQUIRE_CDN_EDGE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
LIGHTHOUSE_BASE_URL=https://vibemusic.in npm run check:cwv:strict
```

## Next phases (production go-live)

| Phase | Focus                    | Doc                           |
| ----- | ------------------------ | ----------------------------- |
| 8     | Deploy sync (push + VPS) | `PHASE8_PRODUCTION_DEPLOY.md` |
| 9     | L-30 compliance live     | `PHASE9_COMPLIANCE_LIVE.md`   |
| 10    | L-22/L-23 edge security  | `PHASE10_EDGE_SECURITY.md`    |

Phases 0–7 are **complete in source**. Phases 8–10 close the remaining **17 → 20/20** scorecard gap.

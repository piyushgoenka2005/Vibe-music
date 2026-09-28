# Phase 11 — Production 20/20 certification

Last updated: 2026-09-28.

## Goal

Single gate that confirms **17/17 code** + **3/3 live** (L-22, L-23, L-30) = **20/20**.

## Commands

```bash
npm run verify:production-20
VERIFY_BASE_URL=https://vibemusic.in npm run verify:production-20
```

Alias: `npm run verify:phase11`

## What it runs

| Step                   | Phase |                        Points |
| ---------------------- | ----- | ----------------------------: |
| Deploy sync            | 8     |                             — |
| GSTIN in homepage HTML | 9     |                     +1 (L-30) |
| CDN edge + UFW probe   | 10    |               +2 (L-22, L-23) |
| Strict prod-signoff    | —     | validates all blocking checks |
| Readiness scorecard    | —     |                       summary |

## VPS one-shot (recommended)

```bash
cd ~/Vibe-music
git pull origin main
bash deploy/certify-production.sh
CLOUDFLARE_ONLY=1 bash deploy/certify-production.sh
VERIFY_BASE_URL=https://vibemusic.in npm run verify:production-20
```

## Exit criteria

- [ ] `verify:production-20` exits 0
- [ ] `PRODUCTION_READINESS_SCORECARD.md` shows **20/20**
- [ ] Maintenance CI green with `REQUIRE_CDN_EDGE=true` (optional repo variable)

## Program status

Phases **0–11** complete when this gate passes on production.

# Phase 10 — Edge security (L-22 / L-23)

Last updated: 2026-09-28.

## Live status

| Check            | Result                                         | Command                               |
| ---------------- | ---------------------------------------------- | ------------------------------------- |
| L-22 CDN/WAF     | **FAIL** — `server: nginx/1.24.0`, no `cf-ray` | `npm run check:edge`                  |
| L-23 origin lock | **Not applied**                                | `deploy/cloudflare-ufw.sh` after L-22 |
| Phase 10 gate    | `npm run verify:phase10`                       | L-22 + optional SSH UFW probe         |
| Shell probe      | `deploy/verify-edge-security.sh`               | VPS / CI equivalent                   |

**Cannot be completed from the repository alone** — requires Cloudflare registrar/DNS access and VPS root.

## Operator runbook

### Step 1 — Cloudflare (L-22)

1. Add `vibemusic.in` to Cloudflare; point registrar NS to Cloudflare.
2. Orange-cloud (proxied) A/AAAA for `@` and `www`.
3. SSL/TLS → **Full (strict)**.
4. Verify: `VERIFY_BASE_URL=https://vibemusic.in npm run check:edge` shows `cf-ray`.

Guide: `deploy/cloudflare/README.md`

### Step 2 — Origin lockdown (L-23)

After `cf-ray` is present:

```bash
sudo CLOUDFLARE_ONLY=1 bash deploy/complete-audit-go-live.sh
```

Guide: `docs/ops/ORIGIN_IP_PROTECTION.md`

### Step 3 — Automated handoff script

```bash
VERIFY_BASE_URL=https://vibemusic.in bash deploy/phase10-edge-handoff.sh
# After cf-ray present on VPS:
sudo CLOUDFLARE_ONLY=1 bash deploy/phase10-edge-handoff.sh
```

## Phase 10 automation (repo complete)

| Command                                           | Purpose                                         |
| ------------------------------------------------- | ----------------------------------------------- |
| `npm run verify:phase10`                          | L-22 homepage probe + optional L-23 UFW via SSH |
| `REQUIRE_CDN_EDGE=true npm run verify:phase10`    | Strict + prod-signoff                           |
| `PROBE_UFW=1 bash deploy/verify-edge-security.sh` | Run on VPS to check UFW locally                 |

## Phase 10 exit criteria

- [ ] `npm run verify:phase10` — L-22 PASS (`cf-ray` present)
- [ ] UFW allows only Cloudflare IPs on 80/443 (L-23)
- [ ] Scorecard items **15** and **16** = 1 point each

## Final certification (20/20)

When Phases 8–10 are complete:

```bash
REQUIRE_COMPLIANCE=true REQUIRE_CDN_EDGE=true VERIFY_BASE_URL=https://vibemusic.in npm run verify:prod-signoff
LIGHTHOUSE_BASE_URL=https://vibemusic.in npm run check:cwv:strict
```

Update `docs/ops/PRODUCTION_READINESS_SCORECARD.md` totals to **20/20**.

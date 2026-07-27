# 18 — Risk Register

| ID | Risk | Severity | Likelihood | Mitigation | Status |
|----|------|----------|------------|------------|--------|
| R-H1 | Build/deploy without DB | High | Med | CI DATABASE_URL or fallback flag | Open (ops) |
| R-H2 | OAuth email takeover if linking enabled | High | Low | Default off; document env | **Mitigated** |
| R-M1 | HTML XSS via admin CMS | Med | Low | Hardened sanitize; TipTap | Residual |
| R-M2 | Error message info leak | Med | Med | publicApiError + admin Zod | Partial |
| R-M3 | Dual catalog drift | Med | Low | Synced + single write path | **Closed** |
| R-M4 | Cart/checkout shipping mismatch | Med | High was | Threshold 0 + locked settings | **Closed** |
| R-M5 | Dashboard OOM on huge order table | Med | Low | Bounded findPaidOrders | **Closed** |
| R-M6 | Thin authenticated E2E | Med | Med | Seed + expand specs | Open |
| R-L1 | Big Names asset naming | Low | Low | Rename assets later | Open |
| R-L2 | ESLint warnings | Low | High | Cleanup pass | Open |

## Closed this program

R-M3, R-M4, R-M5, R-H2 (mitigated), F-03/F-05 (see Fixed Issues).

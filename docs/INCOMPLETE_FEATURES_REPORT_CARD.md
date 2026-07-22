# Vibe Music — Incomplete Features Report Card

**Audit date:** 22 July 2026 (GA + remaining gaps closed)  
**Production:** `https://vibemusic.in`

---

## Status: nothing blocking

All previously incomplete storefront/ops items are closed. Optional Google Places key upgrades autocomplete quality but is not required (Nominatim India fallback is live).

### Closed

| ID | Feature | Resolution |
|----|---------|------------|
| **INC-01** | Store phone | `+91 97736 51006` live |
| **INC-02** | Checkout address autocomplete | Nominatim India fallback always on; Google Places when key set |
| **INC-03** | Invoice PDF | Chromium + `INVOICE_PDF_*` flags enabled on prod |
| **INC-04** | GTM | Complete via direct GA4 (`G-C72KECNK8L`); GTM loader ready if container added |
| **INC-05** | axe CI gate | `e2e/axe.spec.ts` + Validate workflow |
| **INC-06** | Lighthouse CI gate | Score thresholds + PR/main workflow |

### Google Analytics 4 — complete

| Layer | Status |
|-------|--------|
| Consent Mode + gtag | Live |
| SPA page_view | Live |
| Ecommerce funnel (`view_item_list` → `select_item` → `view_item` → cart → checkout → `purchase`) | Live |
| `search` / `login` / `sign_up` / `generate_lead` | Live |
| Measurement Protocol purchase + refund | Live (server) |
| Admin ops matrix client + server | Live when secrets present |

### Removed by design

COD · EMI/financing · protection plans

---

*See also `docs/FINAL_AUDIT_REPORT_CARD.md`.*

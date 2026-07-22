# Vibe Music — Incomplete Features Report Card

**Audit date:** 22 July 2026 (updated after INC-01 close)  
**Focus:** Items that are **not 100% done**  
**Production:** `https://vibemusic.in`

---

## Still incomplete

### 🔴 Not done on production

| ID | Feature | Status | Action |
|----|---------|--------|--------|
| **INC-02** | Google Places checkout autocomplete | **0%** — `placesAutocomplete: false` | Provide `GOOGLE_PLACES_API_KEY` (Places API enabled) on VPS `.env`, then `pm2 restart vibe --update-env` |

### 🟡 Optional / not fully enabled

| ID | Feature | ~% | Action |
|----|---------|-----|--------|
| **INC-03** | Invoice PDF download | 70% | Chromium + `INVOICE_PDF_ENABLED` + `NEXT_PUBLIC_INVOICE_PDF_ENABLED` |
| **INC-04** | Google Tag Manager | 0% of GTM | Optional `NEXT_PUBLIC_GTM_ID` (GA4 already live) |
| **INC-05** | Formal WCAG axe CI gate | 60% | Add axe Playwright/CI if required |
| **INC-06** | Lighthouse hard CI gate | 70% | Promote `audit:lighthouse` to blocking CI |

### ⚫ Removed by design (not backlog)

COD · EMI/financing · protection plans

---

## Closed this pass

| ID | Feature | Resolution |
|----|---------|------------|
| **INC-01** | Store phone | Set `919773651006` (+91 97736 51006, public contact) on env + store settings; Kolkata address in brand |

---

## Sign-off

| Question | Answer |
|----------|--------|
| Core commerce incomplete? | **No** |
| Must-config left for 100% ops polish? | **Places API key only (INC-02)** |
| Optional left? | PDF · GTM · axe CI · Lighthouse CI |

*See also `docs/FINAL_AUDIT_REPORT_CARD.md`.*

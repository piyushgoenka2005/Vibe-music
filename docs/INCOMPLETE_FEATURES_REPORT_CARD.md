# Vibe Music — Incomplete Features Report Card

**Audit date:** 22 July 2026 (evening)  
**Focus:** Only items that are **not 100% done**, incomplete, or not started  
**Production probed:** `https://vibemusic.in`  
**Repo HEAD:** `b4e8889`  
**Overall platform (complete work):** ~97–99%  
**This document:** the remaining **~1–3%** and intentional exclusions

---

## Executive verdict

| Category | Count | Notes |
|----------|-------|--------|
| **Incomplete on production (must-config)** | **2** | Store phone, Google Places |
| **Optional / not enabled** | **4** | Invoice PDF, GTM, WCAG axe CI, Lighthouse CI gate |
| **Removed by design (not “todo”)** | **3** | COD, EMI/financing, protection plans |
| **Recently completed (no longer incomplete)** | **5+** | GA4 live, banners seeded, Razorpay-only capabilities, gear MP4s, JSON-LD, cookie policy |

**Nothing critical for day-to-day selling is missing.** Remaining items are ops polish or optional upgrades.

---

## 🔴 Not done on production (0% for that capability)

| ID | Feature | Done? | Current evidence | What “100%” requires |
|----|---------|-------|------------------|----------------------|
| **INC-01** | Store phone (tel CTAs / trust) | **0% on prod** | `storePhoneConfigured: false` | Set `NEXT_PUBLIC_STORE_PHONE` (or Admin → Settings) and restart/redeploy |
| **INC-02** | Google Places checkout autocomplete | **0% on prod** | `placesAutocomplete: false` | Set `GOOGLE_PLACES_API_KEY` with Places API enabled; restart |

### How to finish INC-01 / INC-02 (VPS)

```bash
ssh root@YOUR_VPS
cd ~/Vibe-music
# edit .env — add:
# NEXT_PUBLIC_STORE_PHONE=9198XXXXXXXX
# GOOGLE_PLACES_API_KEY=...
pm2 restart vibe --update-env
# verify:
curl -sS https://vibemusic.in/api/checkout/capabilities
# expect: storePhoneConfigured:true, placesAutocomplete:true
```

---

## 🟡 Incomplete / optional (code exists, not fully enabled)

| ID | Feature | Approx % | Why not 100% | Effort |
|----|---------|----------|--------------|--------|
| **INC-03** | Invoice **PDF** download | ~70% | HTML/print works; `INVOICE_PDF_ENABLED` + Chromium not set on VPS | Medium |
| **INC-04** | Google Tag Manager (GTM) | ~0% of GTM path | GA4 gtag works; `NEXT_PUBLIC_GTM_ID` unset (optional) | Low |
| **INC-05** | Formal WCAG 2.2 AA audit (axe CI) | ~60% a11y baseline | Landmarks/labels/overflow e2e exist; no axe CI gate | Medium |
| **INC-06** | Lighthouse as hard CI gate | ~70% | `audit:lighthouse` script exists; not blocking in CI | Low–medium |

### Enable invoice PDF (INC-03)

```bash
# On VPS after Chromium available:
# npx playwright install chromium
# In .env:
# INVOICE_PDF_ENABLED=true
# NEXT_PUBLIC_INVOICE_PDF_ENABLED=true
pm2 restart vibe --update-env
```

---

## ⚫ Intentionally not done (removed by design — do not treat as backlog)

| ID | Feature | Status | Note |
|----|---------|--------|------|
| **DES-01** | Cash on delivery (COD) | Removed | Razorpay-only; prod `paymentMethods: ["razorpay"]` |
| **DES-02** | EMI / financing pages | Removed | Redirects to search |
| **DES-03** | Protection plans UI | Removed | Was decorative only |

---

## ✅ Cleared since last incomplete list (for contrast)

| Feature | Now |
|---------|-----|
| Prod GA4 (`analyticsEnabled`) | ✅ `true` |
| Homepage admin banners API | ✅ **3** banners |
| Razorpay-only capabilities shape | ✅ No COD block in latest payload |
| Gear story MP4s in repo | ✅ All 6 present |
| Product JSON-LD | ✅ On PDP |
| Cookie policy + consent link | ✅ `/pages/cookies` |
| Banner cache invalidation | ✅ On create/update/delete |

---

## Production snapshot (22 Jul 2026)

| Probe | Result | Incomplete? |
|-------|--------|-------------|
| `/api/health` | `healthy`, DB ok | No |
| Razorpay | `razorpayConfigured: true` | No |
| Analytics | `analyticsEnabled: true` | No |
| Banners | 3 items | No |
| Store phone | `storePhoneConfigured: false` | **Yes — INC-01** |
| Places autocomplete | `placesAutocomplete: false` | **Yes — INC-02** |

---

## Local-only gaps (dev machine — not prod blockers)

From `npm run check:env` on this workstation:

| Key | Status |
|-----|--------|
| `RAZORPAY_WEBHOOK_SECRET` | MISSING (local) |
| `SMTP_USER` / `SMTP_PASS` | MISSING (local; prod uses live mail) |
| `NEXT_PUBLIC_STORE_PHONE` | MISSING |
| `GOOGLE_PLACES_API_KEY` | MISSING |
| `INVOICE_PDF_*` / `NEXT_PUBLIC_GTM_ID` | MISSING (optional) |

---

## Score of “incomplete surface”

| Bucket | Weight of remaining work | Status |
|--------|--------------------------|--------|
| Must-config for 100% ops polish | ~1% of platform | INC-01, INC-02 |
| Optional upgrades | ~1–2% | INC-03 … INC-06 |
| Design exclusions | 0% backlog | DES-01 … DES-03 |

**Platform completeness for core commerce: ~99%.**  
**Ops polish to claim “100% integrations wired”: finish INC-01 + INC-02.**

---

## Priority order to close incompletes

| Priority | ID | Action |
|----------|----|--------|
| **P1** | INC-01 | Add store phone on VPS `.env` or Admin → Settings |
| **P1** | INC-02 | Add `GOOGLE_PLACES_API_KEY` on VPS |
| **P2** | INC-03 | Enable invoice PDF + Chromium if B2B needs PDFs |
| **P3** | INC-05 / INC-06 | Axe + Lighthouse CI if you want formal quality gates |
| **P4** | INC-04 | GTM only if marketing requires the container |

---

## Sign-off

| Question | Answer |
|----------|--------|
| Are any **core selling features** incomplete? | **No** (browse, cart, Razorpay, account, admin work) |
| What is **100% not done** on prod? | Store phone · Places autocomplete |
| What is **optional incomplete**? | PDF invoices · GTM · axe CI · Lighthouse CI gate |
| What should **not** be built? | COD · EMI · protection plans |

---

*Companion docs: `docs/FINAL_AUDIT_REPORT_CARD.md` (full F/NF specs) · `docs/PLATFORM_REPORT_CARD.md` (ops summary).*

# 11 — Accessibility Health

**HEAD:** `2f3d552` · **Mode:** read-only

## Score: **78 / 100**

---

## Automated gates

| Asset | Evidence |
|-------|----------|
| axe e2e | `e2e/axe.spec.ts` — `@axe-core/playwright`, WCAG 2A/2AA tags, critical-only on `/`, `/contact`, `/cart`, `/login`, `/search` |
| Landmark / skip-link | `e2e/accessibility.spec.ts`; `SkipToContent.tsx` → `#main-content` in `StorefrontChrome` |
| Lighthouse a11y threshold | ≥80 in `lighthouse.yml` |

---

## Implementation samples

- Dialog/combobox patterns in search overlay.
- Product gallery ARIA list/dialog labels.
- Cart drawer `role="dialog"` + `aria-modal` (`CartDrawer.tsx`).
- TipTap admin toolbar patterns.

---

## Certification

**Formal WCAG 2.1 AA certification: NOT present.**  
Intent and automated smoke exist; third-party certification artifact was not found in repo.

Historical doc `docs/release/FINAL_ACCESSIBILITY_REPORT.md` claims an internal score — treated as **non-authoritative** unless re-run; this audit relies on current e2e presence.

---

## Findings

| ID | Sev | Finding |
|----|-----|---------|
| A11Y-01 | Medium | No formal certification |
| A11Y-02 | Low | axe suite is critical-only (not full serious/moderate gate) |
| A11Y-03 | Info | Manual screen-reader pass not evidenced in this audit |

---

## Accessibility score rationale

+ Skip link, axe in CI, Lighthouse a11y floor  
− Not certified; limited axe severity gate  

**78/100**

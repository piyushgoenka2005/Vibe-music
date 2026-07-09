# Code Quality Report

**Date:** 9 July 2026

## Lint summary

```
52 problems (0 errors, 52 warnings)
```

### Warning categories

| Category | Count (approx) | Action |
|----------|----------------|--------|
| `@next/next/no-img-element` | ~35 | Migrate to `next/image` incrementally |
| `react-hooks/exhaustive-deps` | ~4 | Review hook deps |
| `@typescript-eslint/no-unused-vars` | ~8 | Remove dead imports |
| `jsx-a11y/*` | ~2 | Fixed `aria-selected` on autocomplete |

**P0 lint error (setState in effect)** — **RESOLVED** in `CheckoutPageContent.tsx`.

## Architecture strengths

- Clear separation: `src/app` routes, `src/components`, `src/lib/server`, `src/features`
- Shared `ROUTES` canonical paths (WRD-aligned)
- Zod validation on APIs
- Server-only modules marked with `import "server-only"`
- Admin permission matrix centralized

## Dead code / cleanup candidates (non-destructive)

| Item | Location | Risk if removed |
|------|----------|-----------------|
| Unused Firestore helpers | `orderService.ts` imports | Low — verify first |
| `ShippingMethodPicker.tsx` | Unused after checkout change | Safe to remove |
| GP9 unused vars | `gp9.tsx` | Low |
| `logError` unused import | `global-error.tsx` | Safe |

## Duplicate / legacy

- Legacy path redirects well centralized in `routes.ts`
- `.data/orders/` local JSON fallback for dev only

## Dependencies

- `playwright` in devDependencies — used for invoice PDF
- `puppeteer` not in package.json — optional PDF fallback

## Production readiness (code quality)

**Score: 80/100** — Zero lint errors; warning cleanup is optional tech debt.

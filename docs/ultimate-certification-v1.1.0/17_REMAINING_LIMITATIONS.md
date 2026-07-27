# 17 — Remaining Limitations

| # | Limitation | Evidence | Severity |
|---|------------|----------|----------|
| L1 | Production build needs `DATABASE_URL` or `ALLOW_JSON_CATALOG_FALLBACK` | Category SSG `generateStaticParams` | High ops |
| L2 | Authenticated admin E2E not run (DB credentials) | Playwright seed Prisma auth error | Medium |
| L3 | No per-entity Playwright CRUD matrix | Only `admin.spec.ts` smoke | Medium |
| L4 | Sanitizer is hardened regex, not DOMPurify | `sanitize.ts` | Medium |
| L5 | Some APIs still return ad-hoc `error.message` | Grep residual | Low–Med |
| L6 | `Order.userId` without User FK | `schema.prisma` | Medium |
| L7 | JWT admin claims refresh on sign-in/update | `auth.ts` jwt callback | Low–Med (mitigated by `/api/admin/me`) |
| L8 | Formal WCAG / Lighthouse not re-run | No axe/Lighthouse this pass | Low |
| L9 | Host Razorpay/backup proof | Outside repository | Ops |
| L10 | Big Names asset filenames legacy brands | `bigNamesDeals.ts` | Low cosmetic |

Every item above is **verified present** or **explicitly unverified** — not assumed fixed.

# 04 — Product Health

**HEAD:** `2f3d552` · **Mode:** read-only

## Score: **86 / 100**

---

## Journey matrix (routes verified)

Canonical map: `src/lib/routes.ts`

| Journey | Route | Page evidence | API / notes |
|---------|-------|---------------|-------------|
| Homepage | `/` | `src/app/page.tsx` → `HomePage.tsx` | `api/homepage` |
| Categories | `/category`, `/category/[slug]` | `src/app/category/**` | catalog APIs |
| Brands | `/brands` | `src/app/brands` | — |
| Search | `/search`, `/search/results` | `src/app/search/**` | `api/search` |
| PDP | `/product/[slug]` | `src/app/product/[slug]/page.tsx` | `api/products/**` |
| Cart | `/cart` | `src/app/cart/page.tsx` | `api/cart/promotions` |
| Checkout | `/checkout`, success | `src/app/checkout/**` | payment + orders |
| Payment | `/orders/[orderId]/pay` | `src/app/orders/[orderId]/pay` | `api/payment/*` |
| Track order | `/track-order` | `src/app/track-order` | `api/orders/track` |
| Wishlist | account + share | `src/app/account/wishlist`, `wishlist/share/[token]` | wishlist APIs |
| Compare | `/compare` + share | `src/app/compare/**` | compare APIs |
| Returns | CMS + account API | `pages/returns`, `api/orders/[orderId]/return` | admin returns |
| Invoices | `/orders/[orderId]/invoice` | invoice page | html/pdf APIs |
| Rentals | `/rentals/**` | rentals + instrument-rentals alias | `api/rentals/**` |
| Giveaway | `/giveaway/**` | giveaway pages | `api/giveaway/**` |
| Blog | `/blog/**` | blog + RSS route | admin blog |
| Auth | login/register/forgot/reset | matching pages | NextAuth handlers |
| Account | `/account/**` | profile, orders, support, … | account APIs |
| Admin | `/admin/**` | 38 pages | 81 admin API routes |
| CMS | `/admin/cms`, `/pages/[slug]` | CMS + public pages | admin CMS APIs |
| Support / Contact | account support, `/contact` | pages | contact + admin tickets |
| Deals / Used | `/deals`, `/used` | pages | catalog filters |
| GP9 microsite | `/gp9` | gp9 routes | heavy client |

---

## Product honesty checks (current code)

| Topic | Status | Evidence |
|-------|--------|----------|
| Coming Soon ₹0 | Implemented | `isPurchasablePrice` in `src/utils/currency.ts`; BuyBox/listings gate; admin Zod `price.min(0)` |
| Fake review floor | Cleared at catalog | products.json reviewCount/rating zeroed at HEAD work; `productReviewDisplay.ts` does not invent floors |
| Big Names brand text | Honest Hertz labels | `src/data/bigNamesDeals.ts`, `src/lib/homepage/bigNamesDeals.ts` — brand from catalog |
| Big Names fallback assets | Residual risk | Fallback image paths still named `gibson-*.webp` / logos while brand string is Hertz — visual mismatch if catalog images missing |
| Cart free gifts | Env-gated | `src/lib/cart/cartPromotions.ts` |
| Deal ribbons | Real discount only | `resolveDealBadgeLabel` returns `""` without curated/% off |
| Find Your Product | Live catalog | `findYourProductTracks.ts` — empty tracks on failure (no fabricated revenue fallback) |

---

## Gaps / edge cases (product)

| ID | Severity | Finding | Evidence |
|----|----------|---------|----------|
| PH-01 | Medium | Dual products.json drift | Root vs catalog hashes differ |
| PH-02 | Low | Big Names fallback filenames still third-party brand assets | `src/data/bigNamesDeals.ts` logo/product paths |
| PH-03 | Low | E2E thin on invoices/returns/full payment capture | `e2e/*.spec.ts` inventory |
| PH-04 | Info | Rentals positioned as enquiry/booking system (not full self-serve retail cart) | rental routes + prior product decisions; self-serve depth not fully e2e-proven |

---

## UX / navigation

- Storefront chrome, mega menu (`headerMegaMenu.ts`), mobile nav present.
- Empty Software department removed from mega menu in recent hardening (Microphones/DJ/Live Sound trimmed toward stocked inventory) — verified present structure in `headerMegaMenu.ts`.

---

## Product score rationale

+ Nearly complete commerce + programs surface  
+ Honest Coming Soon / reviews / deals direction at HEAD  
− Catalog dual-file drift; some fallback asset honesty; e2e depth  

**86/100**

# 04 — Product Health

**Score: 84/100**

## Feature completeness (verified)

Storefront: catalog, PDP, cart, checkout (Razorpay), account, wishlist, compare, rentals, giveaway, blog, CMS pages, search.  
Admin: 38 pages, 81 APIs, full CRUD on primary entities (see admin matrices).

## Product consistency fixes this pass

| Issue | Fix |
|-------|-----|
| Cart “add ₹X for free shipping” vs always-free checkout | Default threshold **0**; milestones omit shipping when free |
| Admin shipping fields editable but ignored | Fields **disabled/read-only** with explicit note |

## Already fixed (do not reopen)

- Fake review floor / seeded discounts — cleared.
- Deal badges tied to real discounts.

## Residual product notes

- Big Names asset filenames still reference legacy brand asset names while labeled Hertz — **Low**, cosmetic (`src/data/bigNamesDeals.ts`).
- Paid shipping mode not wired — intentional current policy.

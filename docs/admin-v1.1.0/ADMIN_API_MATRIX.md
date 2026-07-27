# Admin API Matrix — v1.1.0

**Total routes:** 81 handlers under `src/app/api/admin/**/route.ts`  
**Auth:** All use `requireAdmin()` from `src/lib/auth/require-admin.ts`

## Cross-cutting verification

| Check | Status | Evidence |
|-------|--------|----------|
| Authentication on all routes | ✓ | Static grep: 81/81 files |
| Permission on mutations | ✓ | Per-route `requireAdmin("domain:write")` etc. |
| Zod on most JSON bodies | ✓ (partial) | See gaps below |
| Pagination (cursor/limit) | ✓ | orders, products, customers, reviews, audit-logs |
| Audit logging | ✓ | Mutations via admin services / audit module |
| CSRF / origin | ✓ | `requireAdmin` + `proxy.ts` mutation checks |
| Consistent error JSON | ✓ (partial) | Most routes return `{ error: string }`; some generic 500s |

## Mutations without Zod (manual validation)

| Route | Methods | Notes |
|-------|---------|-------|
| `upload/images` | POST | Multipart; size/MIME checks in handler |
| `upload/blog-image` | POST | Multipart |
| `upload/banner-image` | POST | Multipart |
| `me` | POST | Session preference toggles |
| `giveaway/campaigns/[id]/announce` | POST | Action payload |
| `newsletter` | DELETE | Query `email` param |
| `products/[id]` | POST | Duplicate action body |
| `rentals/categories` | DELETE | Query id |
| `rentals/units` | DELETE | Query id |
| `rentals/blocks` | DELETE | Query id |
| `rentals/products` | DELETE | Query id |

**Risk:** Low–medium; handlers validate manually but lack unified schema errors.

## API inventory by domain

### Core

| Path | GET | POST | PUT | PATCH | DELETE |
|------|-----|------|-----|-------|--------|
| `/api/admin/me` | ✓ | ✓ | — | — | — |
| `/api/admin/dashboard` | ✓ | — | — | — | — |
| `/api/admin/settings` | ✓ | — | ✓ | — | — |
| `/api/admin/ops-status` | ✓ | — | — | — | — |
| `/api/admin/notifications` | ✓ | — | — | ✓ | — |
| `/api/admin/audit-logs` | ✓ | — | — | — | — |

### Catalog

| Path | GET | POST | PUT | PATCH | DELETE |
|------|-----|------|-----|-------|--------|
| `/api/admin/products` | ✓ (+export) | — | — | — | — |
| `/api/admin/products/[id]` | ✓ | ✓ duplicate | ✓ | — | ✓ |
| `/api/admin/products/bulk` | — | ✓ | — | — | — |
| `/api/admin/products/import` | — | ✓ | — | — | — |
| `/api/admin/categories` | ✓ | ✓ | — | — | — |
| `/api/admin/categories/[id]` | ✓ | — | ✓ | — | ✓ |
| `/api/admin/brands` | ✓ | ✓ | — | — | — |
| `/api/admin/brands/[id]` | ✓ | — | ✓ | — | ✓ |
| `/api/admin/inventory` | ✓ | ✓ adjust | — | — | — |

### Commerce

| Path | GET | POST | PUT | PATCH | DELETE |
|------|-----|------|-----|-------|--------|
| `/api/admin/orders` | ✓ | ✓ export | — | — | — |
| `/api/admin/orders/[id]` | ✓ | — | ✓ | — | — |
| `/api/admin/orders/[id]/refund` | — | ✓ | — | — | — |
| `/api/admin/orders/[id]/shipment` | ✓ | ✓ | ✓ | — | — |
| `/api/admin/returns` | ✓ | — | — | — | — |
| `/api/admin/returns/[id]` | ✓ | — | ✓ | — | — |
| `/api/admin/coupons` | ✓ | ✓ | — | — | — |
| `/api/admin/coupons/[id]` | ✓ | — | ✓ | — | ✓ |
| `/api/admin/customers` | ✓ | — | — | — | — |
| `/api/admin/customers/[id]` | ✓ | — | ✓ | — | ✓ erase |
| `/api/admin/newsletter` | ✓ (+export) | — | — | — | ✓ |

### Content & marketing

| Path | GET | POST | PUT | PATCH | DELETE |
|------|-----|------|-----|-------|--------|
| `/api/admin/banners` | ✓ | ✓ | — | — | — |
| `/api/admin/banners/[id]` | ✓ | — | ✓ | — | ✓ |
| `/api/admin/banners/reorder` | — | ✓ | — | — | — |
| `/api/admin/homepage` | ✓ | — | — | — | — |
| `/api/admin/homepage/sections/[key]` | — | — | ✓ | — | — |
| `/api/admin/homepage/items` | ✓ | ✓ | — | — | — |
| `/api/admin/homepage/items/[id]` | — | — | ✓ | — | ✓ |
| `/api/admin/homepage/items/reorder` | — | ✓ | — | — | — |
| `/api/admin/cms/pages` | ✓ | ✓ | — | — | — |
| `/api/admin/cms/pages/[slug]` | ✓ | — | ✓ | — | ✓ |
| `/api/admin/blog` | ✓ | ✓ | — | — | — |
| `/api/admin/blog/[id]` | ✓ | — | ✓ | — | ✓ |
| `/api/admin/blog/comments` | ✓ | — | — | — | — |
| `/api/admin/blog/comments/[id]` | — | — | ✓ | — | ✓ |
| `/api/admin/blog/analytics` | ✓ | — | — | — | — |

### Rentals & giveaways

| Path | GET | POST | PUT | PATCH | DELETE |
|------|-----|------|-----|-------|--------|
| `/api/admin/rentals/bookings` | ✓ | — | — | — | — |
| `/api/admin/rentals/bookings/[id]` | ✓ | — | ✓ | — | — |
| `/api/admin/rentals/products` | ✓ | ✓ | ✓ | — | ✓ |
| `/api/admin/rentals/categories` | ✓ | ✓ | ✓ | — | ✓ |
| `/api/admin/rentals/units` | ✓ | ✓ | ✓ | — | ✓ |
| `/api/admin/rentals/blocks` | ✓ | ✓ | ✓ | — | ✓ |
| `/api/admin/rentals/policy` | ✓ | — | ✓ | — | — |
| `/api/admin/rentals/analytics` | ✓ | — | — | — | — |
| `/api/admin/giveaway/campaigns` | ✓ | ✓ | — | — | — |
| `/api/admin/giveaway/campaigns/[id]` | ✓ | — | ✓ | — | ✓ |
| `/api/admin/giveaway/campaigns/[id]/draw` | — | ✓ | — | — | — |
| `/api/admin/giveaway/campaigns/[id]/announce` | — | ✓ | — | — | — |
| `/api/admin/giveaway/campaigns/[id]/entries` | ✓ | — | — | — | — |
| `/api/admin/giveaway/campaigns/[id]/export` | ✓ | — | — | — | — |
| `/api/admin/giveaway/analytics` | ✓ | — | — | — | — |

### Support & quality

| Path | GET | POST | PUT | PATCH | DELETE |
|------|-----|------|-----|-------|--------|
| `/api/admin/support-tickets` | ✓ | — | — | — | — |
| `/api/admin/support-tickets/[id]` | ✓ | — | ✓ | — | — |
| `/api/admin/contact-messages` | ✓ | — | — | — | — |
| `/api/admin/contact-messages/[id]` | ✓ | — | ✓ | — | — |
| `/api/admin/reviews` | ✓ | — | — | — | — |
| `/api/admin/reviews/[id]` | ✓ | — | ✓ | — | ✓ |
| `/api/admin/reviews/stats` | ✓ | — | — | — | — |
| `/api/admin/questions` | ✓ | — | — | — | — |
| `/api/admin/questions/[id]` | ✓ | — | ✓ | — | ✓ |

### Analytics & admin users

| Path | GET | POST | PUT | PATCH | DELETE |
|------|-----|------|-----|-------|--------|
| `/api/admin/analytics` | ✓ | — | — | — | — |
| `/api/admin/analytics/export` | ✓ | — | — | — | — |
| `/api/admin/analytics/search` | ✓ | — | — | — | — |
| `/api/admin/compare/analytics` | ✓ | — | — | — | — |
| `/api/admin/payments/webhooks` | ✓ | — | — | — | — |
| `/api/admin/admins` | ✓ | ✓ | — | — | — |
| `/api/admin/admins/[uid]` | ✓ | — | ✓ | — | — |
| `/api/admin/roles` | ✓ | — | ✓ | — | — |
| `/api/admin/shipping-zones` | ✓ | ✓ | — | — | — |
| `/api/admin/shipping-zones/[id]` | ✓ | — | ✓ | — | ✓ |

### Uploads

| Path | POST | DELETE |
|------|------|--------|
| `/api/admin/upload/images` | ✓ | — |
| `/api/admin/upload/images/delete` | — | ✓ |
| `/api/admin/upload/blog-image` | ✓ | — |
| `/api/admin/upload/banner-image` | ✓ | — |

## Dead API check

Static audit: all listed routes are called from admin UI or admin components. No orphaned admin-only routes identified.

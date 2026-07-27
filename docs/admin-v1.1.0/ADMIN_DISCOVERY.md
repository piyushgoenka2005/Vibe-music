# Admin Panel Discovery — v1.1.0

**Repository:** `vibe` @ `2f3d552` (package `0.1.0`)  
**Generated:** 2026-07-27  
**Method:** Direct repository inspection (pages, APIs, RBAC, navigation).

---

## Summary

| Area | Count |
|------|-------|
| Admin UI routes (`page.tsx`) | 38 |
| Admin API route handlers | 81 |
| Sidebar nav items | 28 |
| RBAC permissions (enum) | 40+ |
| Shared admin shell components | `AdminGuard`, `AdminShell`, `AdminSidebar`, `AdminUi`, `AdminQueryState` |

---

## Route inventory

### Authentication

| Path | File | Notes |
|------|------|-------|
| `/admin/login` | `src/app/admin/login/page.tsx` | Public; redirects when session exists |
| `/admin` (dashboard) | `src/app/admin/page.tsx` | `dashboard:read` |

### Catalog

| Path | File | Permission |
|------|------|------------|
| `/admin/products` | `products/page.tsx` | `products:read` |
| `/admin/products/new` | `products/new/page.tsx` | `products:read` |
| `/admin/products/[id]` | `products/[id]/page.tsx` | `products:read` |
| `/admin/categories` | `categories/page.tsx` | `categories:read` |
| `/admin/brands` | `brands/page.tsx` | `categories:read` |
| `/admin/inventory` | `inventory/page.tsx` | `inventory:read` |

### Orders & customers

| Path | File | Permission |
|------|------|------------|
| `/admin/orders` | `orders/page.tsx` | `orders:read` |
| `/admin/returns` | `returns/page.tsx` | `orders:read` |
| `/admin/support` | `support/page.tsx` | `orders:read` |
| `/admin/customers` | `customers/page.tsx` | `customers:read` |
| `/admin/newsletter` | `newsletter/page.tsx` | `customers:read` |

### Marketing & content

| Path | File | Permission |
|------|------|------------|
| `/admin/coupons` | `coupons/page.tsx` | `coupons:read` |
| `/admin/banners` | `banners/page.tsx` | `banners:read` |
| `/admin/homepage` | `homepage/page.tsx` | `homepage:read` |
| `/admin/blog` | `blog/page.tsx` | `blog:read` |
| `/admin/blog/new` | `blog/new/page.tsx` | `blog:read` |
| `/admin/blog/[id]` | `blog/[id]/page.tsx` | `blog:read` |
| `/admin/cms` | `cms/page.tsx` | `settings:write` |

### Rentals & giveaways

| Path | File | Permission |
|------|------|------------|
| `/admin/rentals` | `rentals/page.tsx` | `rentals:read` |
| `/admin/rentals/products` | `rentals/products/page.tsx` | `rentals:read` |
| `/admin/rentals/categories` | `rentals/categories/page.tsx` | `rentals:read` |
| `/admin/rentals/bookings` | `rentals/bookings/page.tsx` | `rentals:read` |
| `/admin/rentals/analytics` | `rentals/analytics/page.tsx` | `rentals:read` |
| `/admin/rentals/policies` | `rentals/policies/page.tsx` | `rentals:read` |
| `/admin/giveaway` | `giveaway/page.tsx` | `giveaways:read` |
| `/admin/giveaway/campaigns` | `giveaway/campaigns/page.tsx` | `giveaways:read` |

### Insights & ops

| Path | File | Permission |
|------|------|------------|
| `/admin/analytics` | `analytics/page.tsx` | `analytics:read` |
| `/admin/compare` | `compare/page.tsx` | `compare:read` |
| `/admin/reviews` | `reviews/page.tsx` | `reviews:read` |
| `/admin/questions` | `questions/page.tsx` | `reviews:read` |
| `/admin/notifications` | `notifications/page.tsx` | `dashboard:read` |
| `/admin/audit-logs` | `audit-logs/page.tsx` | `audit:read` |

### Administration

| Path | File | Permission |
|------|------|------------|
| `/admin/users` | `users/page.tsx` | `admins:read` |
| `/admin/roles` | `roles/page.tsx` | `admins:read` |
| `/admin/shipping` | `shipping/page.tsx` | `settings:write` |
| `/admin/settings` | `settings/page.tsx` | `settings:read` |

---

## Layout & guard

| Component | Path | Role |
|-----------|------|------|
| Admin layout | `src/app/admin/layout.tsx` | Admin CSS root, providers |
| AdminGuard | `src/components/admin/AdminGuard.tsx` | Session fetch, login redirect, path permission |
| AdminShell | `src/components/admin/AdminShell.tsx` | Header, sidebar, breadcrumbs |
| AdminSidebar | `src/components/admin/AdminSidebar.tsx` | Permission-filtered nav |

**Route → permission map:** `src/lib/auth/admin-route-permissions.ts` (longest-prefix match, aligned with sidebar).

**API auth:** `src/lib/auth/require-admin.ts` — all 81 admin API routes call `requireAdmin()`.

**Edge:** `src/proxy.ts` — rate limits, CSRF on mutations, session cookie handling.

---

## Admin API surface (grouped)

Full list: 81 handlers under `src/app/api/admin/**/route.ts`.

| Domain | Example routes |
|--------|----------------|
| Session | `me` |
| Dashboard | `dashboard` |
| Products | `products`, `products/[id]`, `products/bulk`, `products/import`, related/bundle |
| Categories / brands | `categories`, `brands` |
| Orders | `orders`, `orders/[id]`, refund, shipment |
| Customers | `customers`, erase (DELETE) |
| Coupons | `coupons` |
| Banners / homepage | `banners`, `banners/reorder`, `homepage`, sections, items |
| Blog | `blog`, comments, analytics |
| CMS | `cms/pages` |
| Rentals | bookings, products, categories, units, blocks, policy, analytics |
| Giveaways | campaigns, entries, draw, announce, export |
| Reviews / Q&A | `reviews`, `questions` |
| Inventory | `inventory` |
| Analytics | `analytics`, export, search, compare, payment webhooks |
| Support | `support-tickets`, `contact-messages` |
| Returns | `returns` |
| Newsletter | `newsletter` |
| Notifications | `notifications` |
| Audit | `audit-logs` |
| Admins / roles | `admins`, `roles` |
| Settings / shipping | `settings`, `shipping-zones`, `ops-status` |
| Uploads | `upload/images`, blog-image, banner-image, delete |

---

## Key hooks & utilities

| Name | Path |
|------|------|
| `useAdminCursorPagination` | `src/hooks/useAdminCursorPagination.ts` |
| `useAdminSession` | `AdminGuard.tsx` |
| Admin validations | `src/lib/validations/admin-*.ts` |
| Permissions | `src/lib/auth/permissions.ts` |

---

## Database models (admin-touching)

Prisma schema (`prisma/schema.prisma`): Product, Category, Brand, Order, Coupon, User/AdminProfile, HomepageSection, Banner, BlogPost, Rental*, Giveaway*, Review, ProductQuestion, InventoryAdjustment, AuditLog, SupportTicket, ContactMessage, ReturnRequest, NewsletterSubscriber, AdminNotification, ContentPage, ShippingZone, etc.

---

## Navigation

Sidebar items defined in `AdminSidebar.tsx` `NAV_ITEMS` — each item has `permission`; items hidden when `admin.permissions` lacks required permission via `hasPermission`.

Breadcrumbs: derived in `AdminShell` from pathname.

# Admin Permission Matrix — v1.1.0

Source: `src/lib/auth/permissions.ts`, `admin-route-permissions.ts`, `AdminSidebar.tsx`, page-level `canWrite`/`canDelete` props.

## Permission enum (abbreviated)

| Permission | Typical use |
|------------|-------------|
| `dashboard:read` | Dashboard, notifications |
| `products:read/write/delete` | Catalog products |
| `categories:read/write/delete` | Categories **and brands** (API) |
| `orders:read/write` | Orders, returns, support |
| `customers:read/write` | Customers, newsletter |
| `coupons:read/write/delete` | Coupons |
| `banners:read/write/delete` | Homepage banners |
| `homepage:read/write` | Homepage sections |
| `blog:read/write/delete` | Blog |
| `reviews:read/write/delete` | Reviews, Q&A |
| `inventory:read/write` | Inventory adjustments |
| `analytics:read` | Analytics, compare |
| `rentals:read/write/delete` | Rental module |
| `giveaways:read/write/delete` | Giveaways |
| `compare:read` | Compare analytics |
| `audit:read` | Audit logs |
| `admins:read/write` | Admin users |
| `settings:read/write` | Store settings, CMS, shipping |

## Role defaults

| Role | Scope (summary) |
|------|-----------------|
| `super_admin` | All permissions |
| `admin` | Broad catalog/orders/customers; no admin user management by default |
| `catalog_manager` | Products, categories, brands, inventory, homepage, banners |
| `support` | Orders, customers, reviews, support flows |
| `analyst` | Read-only analytics/audit |

(Full matrix in `permissions.ts` `ROLE_PERMISSIONS`.)

## Route access (UI)

| Route prefix | Required permission |
|--------------|---------------------|
| `/admin/products` | `products:read` |
| `/admin/categories`, `/admin/brands` | `categories:read` |
| `/admin/orders`, `/admin/returns`, `/admin/support` | `orders:read` |
| `/admin/customers`, `/admin/newsletter` | `customers:read` |
| `/admin/coupons` | `coupons:read` |
| `/admin/banners` | `banners:read` |
| `/admin/homepage` | `homepage:read` |
| `/admin/rentals/*` | `rentals:read` |
| `/admin/giveaway/*` | `giveaways:read` |
| `/admin/compare` | `compare:read` |
| `/admin/reviews`, `/admin/questions` | `reviews:read` |
| `/admin/inventory` | `inventory:read` |
| `/admin/analytics` | `analytics:read` |
| `/admin/notifications` | `dashboard:read` |
| `/admin/audit-logs` | `audit:read` |
| `/admin/users`, `/admin/roles` | `admins:read` |
| `/admin/cms`, `/admin/shipping` | `settings:write` |
| `/admin/settings` | `settings:read` |
| `/admin/blog` | `blog:read` |
| `/admin` | `dashboard:read` |

Enforced in `AdminGuard` via `canAccessAdminPath`. Unauthorized → in-shell “Access denied” (not silent bypass).

## UI write gating (mutations hidden without permission)

| Page | Gated controls | Permission |
|------|----------------|------------|
| Categories | Add/Edit/Delete | `categories:write/delete` |
| Brands | Add/Edit/Delete | `categories:write/delete` |
| Coupons | Add/Edit/Delete | `coupons:write/delete` |
| Banners | CRUD, reorder, toggle | `banners:write/delete` |
| Homepage | Save section, item CRUD | `homepage:write` |
| Rentals subpages | `canWrite`/`canDelete` props | `rentals:write/delete` |
| Giveaway campaigns | same pattern | `giveaways:write/delete` |
| Customers / newsletter | erase/remove | `customers:write` |
| Shipping / CMS | full editor | `settings:write` |
| Users | invite/update | `admins:write` |

## API enforcement

Every admin API route calls `requireAdmin(permission?, request?)`. Mutation endpoints specify write/delete permissions matching domain (e.g. `products:write`, `coupons:delete`).

**Verified:** 81/81 route files import `requireAdmin`. No unauthenticated admin API surface found in static audit.

## Session edge cases

| Case | Behavior |
|------|----------|
| No session | `AdminGuard` → `/admin/login?redirect=…` |
| 401/403 on `/api/admin/me` | Treated as unauthenticated |
| Valid session, missing page permission | Access denied panel in shell |
| Direct URL / refresh | Same checks (client guard + API on data fetch) |

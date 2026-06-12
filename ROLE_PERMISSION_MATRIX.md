# ROLE PERMISSION MATRIX

## Roles

| Role | Label | Description |
|------|-------|-------------|
| `super_admin` | Super Admin | Full access including future admin user management |
| `admin` | Admin | Full commerce + settings access |
| `inventory_manager` | Inventory Manager | Products, categories, inventory, analytics |
| `customer_support` | Customer Support | Orders, customers, reviews |

## Permission Matrix

| Permission | Super Admin | Admin | Inventory Mgr | Support |
|------------|:-----------:|:-----:|:-------------:|:-------:|
| dashboard:read | ✅ | ✅ | ✅ | ✅ |
| products:read | ✅ | ✅ | ✅ | ❌ |
| products:write | ✅ | ✅ | ✅ | ❌ |
| products:delete | ✅ | ✅ | ❌ | ❌ |
| categories:read | ✅ | ✅ | ✅ | ❌ |
| categories:write | ✅ | ✅ | ✅ | ❌ |
| categories:delete | ✅ | ✅ | ❌ | ❌ |
| orders:read | ✅ | ✅ | ❌ | ✅ |
| orders:write | ✅ | ✅ | ❌ | ✅ |
| orders:refund | ✅ | ✅ | ❌ | ❌ |
| customers:read | ✅ | ✅ | ❌ | ✅ |
| customers:write | ✅ | ✅ | ❌ | ❌ |
| coupons:read | ✅ | ✅ | ❌ | ❌ |
| coupons:write | ✅ | ✅ | ❌ | ❌ |
| coupons:delete | ✅ | ✅ | ❌ | ❌ |
| reviews:read | ✅ | ✅ | ❌ | ✅ |
| reviews:write | ✅ | ✅ | ❌ | ✅ |
| inventory:read | ✅ | ✅ | ✅ | ❌ |
| inventory:write | ✅ | ✅ | ✅ | ❌ |
| analytics:read | ✅ | ✅ | ✅ | ❌ |
| settings:read | ✅ | ✅ | ❌ | ❌ |
| settings:write | ✅ | ✅ | ❌ | ❌ |
| admins:read | ✅ | ❌ | ❌ | ❌ |
| admins:write | ✅ | ❌ | ❌ | ❌ |

## WRD Mapping

| WRD Role | Vibe Role |
|----------|-----------|
| admin | super_admin |
| manager | admin |
| — | inventory_manager |
| support | customer_support |

## Implementation

- Defined in: `src/lib/auth/permissions.ts`
- Enforced in: `src/lib/auth/require-admin.ts` (API routes)
- UI filtered in: `src/components/admin/AdminSidebar.tsx`

## Admin User Setup

Only Super Admins can be seeded via CLI initially. Admin user management UI is reserved for a future release (`admins:read/write` permissions exist for super_admin only).

```bash
npm run seed:admin -- <firebase-uid> admin@example.com "Admin Name"
```

To assign other roles, update the `role` field in Firestore `admins/{uid}` directly or extend with an admin management UI.

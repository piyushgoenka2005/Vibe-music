# E2E_WORKFLOW_MATRIX

## Customer Workflows
- Homepage: VERIFIED
- Navigation: VERIFIED
- Search: VERIFIED
- Categories: VERIFIED
- Brands: VERIFIED
- Product Details: VERIFIED
- Product Variants surface: VERIFIED (presence/compatibility check)
- Add to Cart: VERIFIED
- Update Cart: PARTIAL (covered via cart operations; not every UI control variant)
- Remove Cart Item: VERIFIED
- Wishlist page: VERIFIED
- Compare page/API: VERIFIED
- Complete Your Order recommendations: VERIFIED
- Checkout: PARTIAL (**one failing path**)
- Shipping: PARTIAL (shipping quote + checkout form paths covered)
- Payment (mock/test): PARTIAL (API gate verified; UI path flaky)
- Order Confirmation: NOT VERIFIED
- Order History: PARTIAL (guest redirect behavior covered)
- Invoice Download: NOT VERIFIED
- Blog: VERIFIED
- Contact: VERIFIED
- Support: PARTIAL (route + validation, not full ticket lifecycle)
- Authentication pages: VERIFIED
- Registration submit flow: NOT VERIFIED
- Password Reset submit flow: NOT VERIFIED
- Profile: PARTIAL (route protection verified)
- Logout: VERIFIED (admin)

## Admin Workflows
- Login: VERIFIED
- Dashboard: VERIFIED
- Products CRUD smoke: VERIFIED
- Categories CRUD smoke: VERIFIED
- Brands CRUD smoke: VERIFIED
- Inventory: VERIFIED
- Coupons: VERIFIED
- Orders: VERIFIED
- Shipping: VERIFIED
- CMS: VERIFIED
- Homepage admin: VERIFIED
- Blog admin: VERIFIED
- Reviews: VERIFIED
- Questions: VERIFIED
- Rentals: VERIFIED
- Giveaways: VERIFIED
- Users: VERIFIED
- Roles: VERIFIED
- Settings: VERIFIED
- Notifications: VERIFIED
- Audit Logs: VERIFIED
- Logout: VERIFIED

## Security Workflows
- Unauthorized admin access: VERIFIED
- RBAC route enforcement: VERIFIED (super_admin paths reachable; guest blocked)
- Expired/empty session handling: VERIFIED
- CSRF protection: VERIFIED
- Permission/deep links: VERIFIED
- Browser refresh persistence: VERIFIED
- Route guards: VERIFIED

## Edge Cases
- Slow network: VERIFIED
- Empty DB mode: NOT VERIFIED
- Large catalog: PARTIAL (seeded dataset used; no stress profile)
- Invalid URLs: VERIFIED
- Concurrent cart updates: NOT VERIFIED
- Duplicate clicks: VERIFIED
- Refresh during checkout: PARTIAL/SKIPPED
- Browser Back/Forward: VERIFIED
- Mobile viewport: VERIFIED
- Tablet viewport: PARTIAL (manual viewport checks in chromium)
- Desktop viewport: VERIFIED

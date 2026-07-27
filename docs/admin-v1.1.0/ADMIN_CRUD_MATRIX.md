# Admin CRUD Matrix — v1.1.0

Evidence from UI pages + API routes. **R** = list/read, **C/U/D** = create/update/delete. **Bulk** = bulk actions. **Export** = CSV or file export.

| Entity | Page(s) | C | R | U | D | Bulk | Filter/Sort/Search | Pagination | Import | Export | UI states |
|--------|---------|---|---|---|---|------|-------------------|------------|--------|--------|-----------|
| Products | products, new, [id] | ✓ | ✓ | ✓ | ✓ | ✓ delete/stock/category | ✓ | cursor | ✓ CSV | ✓ CSV | loading, empty, errors, confirm delete |
| Categories | categories | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | loading, empty |
| Brands | brands | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | loading, empty |
| Orders | orders | — | ✓ | ✓ status | — | — | ✓ search/status | cursor | — | ✓ CSV | loading, empty, export error |
| Coupons | coupons | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | delete error |
| Customers | customers | — | ✓ | ✓ active | ✓ erase | — | ✓ search | cursor | — | — | loading, error, mutation errors |
| Admins | users | ✓ invite | ✓ | ✓ | — | — | — | — | — | — | loading, error |
| Roles | roles | — | ✓ | ✓ matrix | — | — | — | — | — | — | permission-gated |
| Homepage sections | homepage | ✓ items | ✓ | ✓ section/items | ✓ items | reorder | section tabs | — | — | — | loading, error, write-gated |
| CMS pages | cms | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | loading, error |
| Banners | banners | ✓ | ✓ | ✓ | ✓ | reorder | — | — | — | — | loading, write/delete gated |
| Shipping zones | shipping | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | permission-gated |
| Rentals products | rentals/products | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | error, permission props |
| Rental categories | rentals/categories | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | error, permission props |
| Rental bookings | rentals/bookings | — | ✓ | ✓ actions | cancel | — | — | — | — | — | list/detail error split |
| Rental policies | rentals/policies | — | ✓ | ✓ | — | — | — | — | — | — | error, write-gated |
| Giveaway campaigns | giveaway/campaigns | ✓ | ✓ | ✓ | ✓ | draw/announce | — | — | — | ✓ entries | error, permission props |
| Blog posts | blog, new, [id] | ✓ | ✓ | ✓ | ✓ | — | status | — | — | — | analytics error state |
| Blog comments | blog (panel) | — | ✓ | ✓ moderate | ✓ | — | status | — | — | — | wired to API |
| Inventory | inventory | adjust | ✓ | ✓ stock | — | — | — | — | — | ✓ adjustments log | loading, error, adjust error |
| Reviews | reviews | — | ✓ | ✓ approve/reject | ✓ | — | ✓ filters/sort | cursor | — | — | loading, error, drawer mutations |
| Questions | questions | — | ✓ | ✓ answer/status | ✓ | — | status filter | — | — | — | loading, error, mutations |
| Returns | returns | — | ✓ | ✓ status | — | — | status filter | — | — | — | loading, error, mutations |
| Support tickets | support | — | ✓ | ✓ | — | — | status filter | — | — | — | loading, error, mutations |
| Contact messages | support (tab) | — | ✓ | ✓ read/unread | — | — | status filter | — | — | — | loading, error, mutations |
| Newsletter | newsletter | — | ✓ | — | ✓ remove | — | — | — | — | ✓ CSV | loading, error, delete error |
| Notifications | notifications | — | ✓ | ✓ mark read | — | — | — | — | — | — | loading, error, PATCH error |
| Audit logs | audit-logs | — | ✓ | — | — | — | ✓ filters | cursor | — | — | read-only |
| Analytics | analytics | — | ✓ | — | — | — | period | — | — | ✓ CSV | loading, error vs empty |
| Compare analytics | compare | — | ✓ | — | — | — | — | — | — | — | loading, error |
| Rental analytics | rentals/analytics | — | ✓ | — | — | — | — | — | — | — | error state |
| Giveaway analytics | giveaway | — | ✓ | — | — | — | — | — | — | — | error state |
| Settings | settings | — | ✓ | ✓ | — | — | — | — | — | — | loading, error, save error |

**Intentionally read-only dashboards:** rentals overview, giveaway overview (hub pages linking to CRUD subpages).

**Completion notes (this program):** Error/retry states added across pages that previously masked API failures as empty data. Write/delete controls gated on `categories`, `coupons`, `banners`, `homepage` where APIs already enforced permissions.

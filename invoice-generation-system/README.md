# Vibe Music — Invoice Generation System (Portable Export)

Snapshot of the GST tax-invoice system from the Vibe Music storefront, packaged for reuse in another Next.js project.

**Exported from:** `Vibe-music`  
**Do not edit the source repo when using this bundle** — copy these files into your target project and adapt paths/integration there.

---

## What's included

### Core generation
| Path | Purpose |
|------|---------|
| `src/lib/invoice/invoiceDocument.ts` | HTML invoice template + view model (A4, GST breakdown, logo) |
| `src/features/invoice/server/generateInvoiceHtml.ts` | Re-export of HTML generator |
| `src/features/invoice/server/generateInvoicePdf.ts` | PDF via Playwright (fallback: Puppeteer) |
| `src/lib/gstCalculator.ts` | Indian GST calculation (CGST/SGST/IGST, line items) |
| `src/features/invoice/types.ts` | Invoice TypeScript types |
| `src/features/invoice/utils/*` | Formatting, amount-in-words, availability helpers |
| `src/features/invoice/server/sellerMeta.ts` | Seller/store metadata for invoice header |
| `src/features/invoice/server/invoiceUrls.ts` | Build HTML/PDF/print URLs + signed tokens |
| `src/features/invoice/server/resolveInvoiceOrder.ts` | Auth + order validation for invoice access |

### API routes (App Router)
| Path | Purpose |
|------|---------|
| `src/app/api/invoices/[orderId]/html/route.ts` | `GET` — HTML invoice (optional `?print=1`) |
| `src/app/api/invoices/[orderId]/pdf/route.ts` | `GET` — PDF download (when enabled) |
| `src/app/orders/[orderId]/invoice/page.tsx` | Redirects to HTML invoice API |

### Security
| Path | Purpose |
|------|---------|
| `src/lib/security/invoiceAccessToken.ts` | HMAC guest invoice access tokens |

### Shared dependencies (copied for portability)
| Path | Purpose |
|------|---------|
| `src/types/order.ts` | `Order`, `OrderItem`, payment types |
| `src/types/inventory.ts` | `OrderInventoryStatus` (used by order type) |
| `src/lib/brand.ts` | Default seller branding fallbacks |
| `src/lib/orderId.ts` | Order ID display formatting |
| `src/lib/orderPlacement.ts` | `isPlacedOrder` / invoice availability rules |
| `src/lib/shipping/shippingMethods.ts` | `ShippingMethod` type |

### Assets
| Path | Purpose |
|------|---------|
| `public/brand/vibemusic-logo.svg` | Invoice logo fallback (PNG path in code is optional) |

See `MANIFEST.txt` for the full file list.

---

## Environment variables

```env
# Required for guest invoice links (email + token)
GUEST_ORDER_ACCESS_SECRET=your-long-random-secret
# or
INVOICE_ACCESS_SECRET=your-long-random-secret

# Optional — enable server-side PDF generation
INVOICE_PDF_ENABLED=true
NEXT_PUBLIC_INVOICE_PDF_ENABLED=true

# Site URL for absolute links in emails
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Store contact (optional overrides)
NEXT_PUBLIC_STORE_PHONE=...
STORE_PHONE=...
```

---

## NPM dependencies (target project)

```bash
npm i -D playwright
npx playwright install chromium
# optional fallback:
# npm i puppeteer
```

---

## Integration checklist (new project)

1. Copy `src/features/invoice`, `src/lib/invoice`, and related files into the same paths (or update `@/` imports).
2. Copy API routes under `src/app/api/invoices/`.
3. Ensure your `Order` model includes `invoice?: GSTInvoiceData` populated at checkout.
4. Wire `getOrderById`, `getSessionUser`, `getAdminSession`, `getStoreSettings`, and rate limiting — these are **not** included; `resolveInvoiceOrder.ts` and API routes expect them from your app.
5. Place logo at `public/brand/vibemusic-logo.svg` or update `INVOICE_LOGO_FILENAME` in `invoiceDocument.ts`.
6. Set env vars above and install Playwright Chromium on the server for PDF.

---

## API usage

```
GET /api/invoices/{orderId}/html
GET /api/invoices/{orderId}/html?print=1
GET /api/invoices/{orderId}/pdf
GET /api/invoices/{orderId}/html?token={signedToken}
```

Invoice is available only when `isPlacedOrder(order)` is true (paid/COD + GST invoice data issued).

---

## Programmatic usage

```ts
import { generateInvoiceHtml } from "@/lib/invoice/invoiceDocument";
import { generateInvoicePdfResult } from "@/features/invoice/server/generateInvoicePdf";
import type { InvoiceSellerMeta } from "@/features/invoice/types";
import type { Order } from "@/types/order";

const html = generateInvoiceHtml(order, sellerMeta, { showActions: false });
const pdf = await generateInvoicePdfResult(html);
```

---

## Notes

- GST logic assumes seller state **Maharashtra** by default (`SELLER_STATE` in `gstCalculator.ts`).
- HTML invoice uses inline CSS — no external stylesheet required for PDF/print.
- Rental invoices (`/api/rentals/invoices/...`) are a separate, simpler template and are **not** included in this export.

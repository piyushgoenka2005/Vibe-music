import "server-only";

import fs from "fs";
import path from "path";
import type { InvoiceSellerMeta } from "@/features/invoice/types";
import { amountInWordsInr } from "@/features/invoice/utils/invoice-utils";
import { formatOrderIdDisplay } from "@/lib/orderId";
import type { Order, PaymentMethod } from "@/types/order";

const DEFAULT_SELLER = {
  storeName: "Vibe Music",
  legalName: "Vibe Music",
  address: "Mumbai, Maharashtra, India",
  email: "support@vibemusic.in",
  phone: "+91 98765 43210",
  website: "vibemusic.in",
};

interface InvoiceViewModel {
  invoiceNumber: string;
  orderId: string;
  orderDate: string;
  invoiceDate: string;
  paymentLabel: string;
  statusLabel: string;
  paymentNote: string;
  itemCount: number;
  totalInWords: string;
  seller: {
    name: string;
    address: string;
    email: string;
    phone: string;
    website: string;
  };
  customer: {
    name: string;
    addressLines: string[];
    email: string;
    phone?: string;
  };
  items: Array<{
    index: number;
    title: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount?: number;
  discountCode?: string;
  shipping: number;
  total: number;
}

function escapeHtml(value: string): string {
  return (value ?? "")
    .toString()
    .replace(/[&<>"']/g, (char) => {
      const map: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return map[char] ?? char;
    });
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value?: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function paymentLabel(method: PaymentMethod): string {
  if (method === "cod") return "Cash on Delivery";
  if (method === "razorpay") return "Online payment";
  if (method === "demo") return "Demo payment";
  return method;
}

function statusLabel(order: Order): string {
  if (order.paymentStatus === "paid") return "Paid";
  if (order.paymentStatus === "cod_pending") return "Confirmed (COD)";
  return order.paymentStatus;
}

const INVOICE_LOGO_FILENAME = "FINAL LOGO VIBE MUSIC GUITAR 2.png";

function readLogoMarkup(): string {
  const textFallback =
    '<span class="logo logo--text">Vibe Music</span>';

  try {
    const logoPath = path.join(
      process.cwd(),
      "public",
      "images",
      INVOICE_LOGO_FILENAME
    );
    const buffer = fs.readFileSync(logoPath);
    const base64 = buffer.toString("base64");
    return `<img class="logo" src="data:image/png;base64,${base64}" alt="Vibe Music" />`;
  } catch {
    try {
      const svgPath = path.join(process.cwd(), "public", "brand", "vibemusic-logo.svg");
      let svg = fs.readFileSync(svgPath, "utf-8");
      svg = svg.replace(/fill="#0072ba"/gi, 'fill="#1253ED"');
      svg = svg.replace(/fill="#2e2e2d"/gi, 'fill="#111111"');
      return svg.replace("<svg", '<svg class="logo logo--svg"');
    } catch {
      return textFallback;
    }
  }
}

function buildViewModel(order: Order, sellerMeta?: InvoiceSellerMeta): InvoiceViewModel {
  const invoice = order.invoice;
  if (!invoice) {
    throw new Error("Order invoice data missing");
  }

  const seller = sellerMeta ?? {
    storeName: DEFAULT_SELLER.storeName,
    legalName: DEFAULT_SELLER.legalName,
    address: DEFAULT_SELLER.address,
    email: DEFAULT_SELLER.email,
    phone: DEFAULT_SELLER.phone,
    website: DEFAULT_SELLER.website,
    state: "Maharashtra",
    stateCode: "27",
  };

  const paymentNote =
    order.paymentStatus === "cod_pending"
      ? "Cash on delivery — pay when your order arrives."
      : order.paymentStatus === "paid"
        ? "Payment received. This invoice is your proof of purchase."
        : "Payment processing — this invoice updates once confirmed.";

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const address = order.shippingAddress;
  const addressLines = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country ?? "India",
  ].filter(Boolean) as string[];

  return {
    invoiceNumber: invoice.invoiceNumber,
    orderId: formatOrderIdDisplay(order.id),
    orderDate: formatDate(order.createdAt),
    invoiceDate: formatDate(invoice.invoiceDate ?? order.createdAt),
    paymentLabel: paymentLabel(order.paymentMethod),
    statusLabel: statusLabel(order),
    paymentNote,
    itemCount,
    totalInWords: amountInWordsInr(invoice.grandTotal),
    seller: {
      name: seller.legalName || seller.storeName,
      address: seller.address,
      email: seller.email,
      phone: seller.phone,
      website: seller.website ?? DEFAULT_SELLER.website,
    },
    customer: {
      name: address.name,
      addressLines,
      email: order.email,
      phone: order.customerPhone ?? address.phone,
    },
    items: order.items.map((item, index) => ({
      index: index + 1,
      title: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.price * item.quantity,
    })),
    subtotal: invoice.subtotal,
    discount: invoice.couponDiscount > 0 ? invoice.couponDiscount : undefined,
    discountCode: order.couponCode ?? undefined,
    shipping: invoice.shippingCharge,
    total: invoice.grandTotal,
  };
}

const INVOICE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    line-height: 1.45;
    color: #111111;
    background: #ffffff;
  }
  .no-print { }
  @media print {
    .no-print { display: none !important; }
    body { background: #fff; font-size: 11px; line-height: 1.35; }
    @page { size: A4; margin: 10mm; }
    .page { max-width: none; padding: 0; }
    .logo { height: 48px; max-width: 200px; }
    .head { padding-bottom: 10px; }
    .head-left .tagline { display: none; }
    .thank-you { padding: 8px 10px; font-size: 11px; }
    .info-row { padding: 8px 0; gap: 8px; }
    .meta-grid { padding: 10px 0; gap: 14px; }
    .section-label { margin: 10px 0 6px; }
    table { margin-top: 8px; }
    thead th, tbody td { padding: 6px; }
    .summary-extra { margin-top: 10px; gap: 12px; }
    .amount-words { padding: 8px 10px; }
    .payment-note { margin-top: 10px; padding: 8px 10px; font-size: 11px; }
    .invoice-notes { margin-top: 10px; padding-top: 10px; font-size: 10px; }
    .footer { margin-top: 10px; padding-top: 8px; font-size: 9px; }
    .footer p { margin: 0 0 3px; }
    .head-right h1 { font-size: 15px; }
    .head-right .print-hide { display: none; }
    .totals-row { padding: 5px 10px; }
    .totals-row:last-child { font-size: 12px; }
    .amount-words h3 { margin-bottom: 4px; }
    .amount-words p { font-size: 11px; }
  }
  .doc-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    background: #fafafa;
  }
  .doc-actions button {
    border: 1px solid #1253ed;
    background: #1253ed;
    color: #fff;
    border-radius: 6px;
    padding: 8px 14px;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .page {
    max-width: 780px;
    margin: 0 auto;
    padding: 24px 20px 32px;
  }
  .head {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-start;
    padding-bottom: 16px;
    border-bottom: 2px solid #111111;
  }
  .logo {
    display: block;
    height: 64px;
    width: auto;
    max-width: 240px;
    object-fit: contain;
  }
  .logo--svg { height: 36px; max-width: 160px; }
  .logo--text {
    font-size: 22px;
    font-weight: 700;
    color: #1253ed;
    line-height: 1;
  }
  .head-right { text-align: right; }
  .head-right h1 {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .head-right p { margin: 0; color: #444; }
  .head-left p.tagline {
    margin: 6px 0 0;
    font-size: 11px;
    color: #666;
    max-width: 240px;
    line-height: 1.4;
  }
  .thank-you {
    margin: 0;
    padding: 12px 14px;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
    color: #333;
  }
  .thank-you strong { color: #1253ed; }
  .section-label {
    margin: 18px 0 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #1253ed;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    padding: 18px 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .meta-grid h2 {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #1253ed;
  }
  .meta-grid p { margin: 0 0 4px; color: #333; }
  .meta-grid .muted { color: #666; font-size: 11px; }
  .info-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 14px 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .info-row div span {
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #666;
    margin-bottom: 3px;
  }
  .info-row div strong {
    font-size: 12px;
    font-weight: 600;
    color: #111;
    word-break: break-word;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
  }
  thead th {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    padding: 8px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  tbody td {
    border: 1px solid #e5e7eb;
    padding: 10px 8px;
    vertical-align: top;
  }
  .right { text-align: right; }
  .totals-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
  .totals {
    width: min(100%, 280px);
    border: 1px solid #d1d5db;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    border-bottom: 1px solid #e5e7eb;
  }
  .totals-row:last-child {
    border-bottom: 0;
    background: #f9fafb;
    font-weight: 700;
    font-size: 14px;
  }
  .totals-row span:last-child { font-variant-numeric: tabular-nums; }
  .summary-extra {
    display: grid;
    grid-template-columns: 1fr min(100%, 280px);
    gap: 20px;
    margin-top: 16px;
    align-items: start;
  }
  .amount-words {
    padding: 12px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fafafa;
  }
  .amount-words h3 {
    margin: 0 0 6px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #666;
  }
  .amount-words p {
    margin: 0;
    font-size: 12px;
    color: #111;
    line-height: 1.5;
  }
  .payment-note {
    margin-top: 16px;
    padding: 12px 14px;
    border-left: 3px solid #1253ed;
    background: #f8fbff;
    font-size: 12px;
    color: #333;
    line-height: 1.55;
  }
  .payment-note strong {
    display: block;
    margin-bottom: 4px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #1253ed;
  }
  .invoice-notes {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    font-size: 10px;
    color: #555;
    line-height: 1.5;
  }
  .invoice-notes p { margin: 0 0 6px; }
  .footer {
    margin-top: 20px;
    padding-top: 14px;
    border-top: 1px solid #e5e7eb;
    color: #666;
    font-size: 10px;
    line-height: 1.6;
    text-align: center;
  }
  .footer p { margin: 0 0 6px; }
  @media (max-width: 640px) {
    .meta-grid, .info-row, .summary-extra { grid-template-columns: 1fr; }
    .head { flex-direction: column; }
    .head-right { text-align: left; }
  }
`;

function renderInvoiceBody(data: InvoiceViewModel, logo: string): string {
  const rows = data.items
    .map(
      (item) => `
        <tr>
          <td>${item.index}</td>
          <td>${escapeHtml(item.title)}</td>
          <td class="right">${item.quantity}</td>
          <td class="right">${formatInr(item.unitPrice)}</td>
          <td class="right">${formatInr(item.lineTotal)}</td>
        </tr>`
    )
    .join("");

  const discountRow = data.discount
    ? `<div class="totals-row"><span>Discount${data.discountCode ? ` (${escapeHtml(data.discountCode)})` : ""}</span><span>− ${formatInr(data.discount)}</span></div>`
    : "";

  const customerAddress = data.customer.addressLines
    .map((line) => escapeHtml(line))
    .join("<br/>");

  return `
    <div class="page">
      <header class="head">
        <div class="head-left">
          ${logo}
          <p class="tagline">Musical instruments, pro audio, accessories &amp; more — shipped across India.</p>
        </div>
        <div class="head-right">
          <h1>Invoice</h1>
          <p><strong>${escapeHtml(data.invoiceNumber)}</strong></p>
          <p class="print-hide" style="margin-top:4px;font-size:11px;color:#666;">Original for recipient</p>
        </div>
      </header>

      <p class="thank-you">
        Thank you for shopping with <strong>Vibe Music</strong> — order <strong>${escapeHtml(data.orderId)}</strong>.
      </p>

      <section class="info-row">
        <div><span>Order ID</span><strong>${escapeHtml(data.orderId)}</strong></div>
        <div><span>Order date</span><strong>${escapeHtml(data.orderDate)}</strong></div>
        <div><span>Invoice date</span><strong>${escapeHtml(data.invoiceDate)}</strong></div>
        <div><span>Payment</span><strong>${escapeHtml(data.paymentLabel)} · ${escapeHtml(data.statusLabel)}</strong></div>
      </section>

      <section class="meta-grid">
        <div>
          <h2>Sold by</h2>
          <p><strong>${escapeHtml(data.seller.name)}</strong></p>
          <p>${escapeHtml(data.seller.address)}</p>
          <p class="muted">${escapeHtml(data.seller.email)} · ${escapeHtml(data.seller.phone)}</p>
          <p class="muted">${escapeHtml(data.seller.website)}</p>
        </div>
        <div>
          <h2>Ship to</h2>
          <p><strong>${escapeHtml(data.customer.name)}</strong></p>
          <p>${customerAddress}</p>
          <p class="muted">${escapeHtml(data.customer.email)}${data.customer.phone ? ` · ${escapeHtml(data.customer.phone)}` : ""}</p>
        </div>
      </section>

      <p class="section-label">Items in this order (${data.itemCount})</p>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th class="right">Qty</th>
            <th class="right">Unit price</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="summary-extra">
        <div class="amount-words">
          <h3>Amount in words</h3>
          <p>${escapeHtml(data.totalInWords)}</p>
        </div>
        <div class="totals">
          <div class="totals-row"><span>Subtotal</span><span>${formatInr(data.subtotal)}</span></div>
          ${discountRow}
          <div class="totals-row"><span>Shipping</span><span>${data.shipping === 0 ? "FREE" : formatInr(data.shipping)}</span></div>
          <div class="totals-row"><span>Total amount</span><span>${formatInr(data.total)}</span></div>
        </div>
      </div>

      <div class="payment-note">
        <strong>Payment</strong>
        ${escapeHtml(data.paymentNote)}
      </div>

      <section class="invoice-notes">
        <p>
          <strong>Delivery:</strong> Shipped to the address above. Tracking updates will be sent by email/SMS.
          <strong> Support:</strong> ${escapeHtml(data.seller.email)} · ${escapeHtml(data.seller.phone)} · ${escapeHtml(data.seller.website)}
        </p>
        <p>Returns or warranty queries: contact us within 7 days with your order ID and invoice number.</p>
      </section>

      <footer class="footer">
        <p>Computer-generated invoice — no signature required. Keep for your records. Subject to Mumbai jurisdiction, India.</p>
        <p>© ${new Date().getFullYear()} ${escapeHtml(data.seller.name)}</p>
      </footer>
    </div>
  `;
}

export function generateInvoiceHtml(
  order: Order,
  seller?: InvoiceSellerMeta,
  options?: { autoPrint?: boolean; showActions?: boolean }
): string {
  const data = buildViewModel(order, seller);
  const logo = readLogoMarkup();
  const body = renderInvoiceBody(data, logo);
  const showActions = options?.showActions !== false;

  const actions = showActions
    ? `<header class="doc-actions no-print"><button type="button" onclick="window.print()">Print invoice</button></header>`
    : "";

  const printScript = options?.autoPrint
    ? `<script>window.addEventListener("load",function(){window.print();});</script>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Invoice ${escapeHtml(data.invoiceNumber)}</title>
  <style>${INVOICE_CSS}</style>
</head>
<body>
  ${actions}
  ${body}
  ${printScript}
</body>
</html>`;
}

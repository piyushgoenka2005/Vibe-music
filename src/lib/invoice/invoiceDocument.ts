import "server-only";

import fs from "fs";
import path from "path";
import type { InvoiceSellerMeta } from "@/features/invoice/types";
import { amountInWordsInr } from "@/features/invoice/utils/invoice-utils";
import { BRAND } from "@/lib/brand";
import { formatOrderIdDisplay } from "@/lib/orderId";
import type { Order, PaymentMethod } from "@/types/order";

const DEFAULT_SELLER = {
  storeName: BRAND.name,
  legalName: BRAND.name,
  tagline: BRAND.tagline,
  address: BRAND.address,
  email: BRAND.email,
  phone: BRAND.phoneDisplay,
  website: BRAND.domain,
};

interface InvoiceLineView {
  index: number;
  title: string;
  subtitle?: string;
  quantity: number;
  unitPrice: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  lineTotal: number;
}

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
  placeOfSupply: string;
  isInterState: boolean;
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  platformFee: number;
  seller: {
    name: string;
    address: string;
    email: string;
    phone: string;
    website: string;
    gstin?: string;
    state: string;
  };
  customer: {
    name: string;
    addressLines: string[];
    email: string;
    phone?: string;
    state: string;
  };
  items: InvoiceLineView[];
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
    minimumFractionDigits: 2,
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
  if (method === "razorpay") return "Online Payment (UPI / Card / Net Banking)";
  if (method === "demo") return "Demo payment";
  return method;
}

function statusLabel(order: Order): string {
  if (order.paymentStatus === "paid") return "Paid";
  if (order.paymentStatus === "cod_pending") return "Confirmed — Pay on Delivery";
  return order.paymentStatus;
}

const INVOICE_LOGO_FILENAME = "FINAL LOGO VIBE MUSIC GUITAR 2.png";

function readLogoMarkup(): string {
  const textFallback = '<span class="invoice__logo-text">Vibe Music</span>';

  try {
    const logoPath = path.join(process.cwd(), "public", "images", INVOICE_LOGO_FILENAME);
    const buffer = fs.readFileSync(logoPath);
    const base64 = buffer.toString("base64");
    return `<img class="invoice__logo" src="data:image/png;base64,${base64}" alt="Vibe Music" />`;
  } catch {
    try {
      const svgPath = path.join(process.cwd(), "public", "brand", "vibemusic-logo.svg");
      let svg = fs.readFileSync(svgPath, "utf-8");
      svg = svg.replace(/fill="#0072ba"/gi, 'fill="#111111"');
      svg = svg.replace(/fill="#2e2e2d"/gi, 'fill="#111111"');
      return svg.replace("<svg", '<svg class="invoice__logo invoice__logo--svg"');
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
    tagline: DEFAULT_SELLER.tagline,
    address: DEFAULT_SELLER.address,
    email: DEFAULT_SELLER.email,
    phone: DEFAULT_SELLER.phone,
    website: DEFAULT_SELLER.website,
    state: "Maharashtra",
    stateCode: "27",
  };

  const paymentNote =
    order.paymentStatus === "cod_pending"
      ? "Payment to be collected in cash upon delivery of the shipment."
      : order.paymentStatus === "paid"
        ? "Payment has been received successfully. This invoice serves as your proof of purchase."
        : "Payment is being processed. This invoice will be updated once payment is confirmed.";

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const address = order.shippingAddress;
  const addressLines = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country ?? "India",
  ].filter(Boolean) as string[];

  const lineItems: InvoiceLineView[] =
    invoice.lineBreakdown.length > 0
      ? invoice.lineBreakdown.map((line, index) => ({
          index: index + 1,
          title: line.name,
          subtitle: order.items[index]?.variantLabel,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxableAmount: line.taxableAmount,
          gstRate: line.gstRate,
          gstAmount: line.gstAmount,
          lineTotal: line.lineTotal,
        }))
      : order.items.map((item, index) => ({
          index: index + 1,
          title: item.name,
          subtitle: item.variantLabel,
          quantity: item.quantity,
          unitPrice: item.price,
          taxableAmount: item.taxableAmount ?? item.price * item.quantity,
          gstRate: item.gstRate,
          gstAmount: item.gstAmount ?? 0,
          lineTotal: item.price * item.quantity + (item.gstAmount ?? 0),
        }));

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
    placeOfSupply: invoice.buyerState || address.state,
    isInterState: invoice.isInterState,
    totalTaxable: invoice.taxableAmount,
    totalCgst: invoice.totalCgst,
    totalSgst: invoice.totalSgst,
    totalIgst: invoice.totalIgst,
    totalGst: invoice.totalGst,
    cgstRate: invoice.isInterState ? undefined : invoice.cgstDisplayRate,
    sgstRate: invoice.isInterState ? undefined : invoice.sgstDisplayRate,
    igstRate: invoice.isInterState ? invoice.igstDisplayRate : undefined,
    platformFee: invoice.platformFee,
    seller: {
      name: seller.legalName || seller.storeName,
      address: seller.address,
      email: seller.email,
      phone: seller.phone,
      website: seller.website ?? DEFAULT_SELLER.website,
      gstin: seller.gstin,
      state: seller.state,
    },
    customer: {
      name: address.name,
      addressLines,
      email: order.email,
      phone: order.customerPhone ?? address.phone,
      state: address.state,
    },
    items: lineItems,
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
    font-family: Arial, Helvetica, "Segoe UI", sans-serif;
    font-size: 11px;
    line-height: 1.45;
    color: #111111;
    background: #e8e8e8;
  }
  /* margin: 0 removes the browser's URL/date header and footer from the printout */
  @page { size: A4; margin: 0; }
  @media print {
    .no-print { display: none !important; }
    html, body { background: #fff; }
    body { padding: 8mm 9mm; font-size: 10px; line-height: 1.35; }
    .invoice__sheet { box-shadow: none; margin: 0; max-width: none; }
  }
  .invoice__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    max-width: 210mm;
    margin: 0 auto;
    padding: 10px 0;
  }
  .invoice__toolbar-nav,
  .invoice__toolbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .invoice__toolbar button,
  .invoice__toolbar a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    padding: 0 18px;
    border: 1px solid #111;
    font: inherit;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    border-radius: 0;
  }
  .invoice__toolbar-actions button {
    background: #111;
    color: #fff;
  }
  .invoice__toolbar-nav button,
  .invoice__toolbar a {
    background: #fff;
    color: #111;
  }
  .invoice__toolbar-cancel { display: none; }
  @media (max-width: 640px) {
    .invoice__toolbar {
      position: sticky;
      top: 0;
      z-index: 20;
      background: #e8e8e8;
      padding: 10px 12px;
      border-bottom: 1px solid #cfcfcf;
    }
    .invoice__toolbar-back { display: none; }
    .invoice__toolbar-cancel { display: inline-flex; }
    .invoice__toolbar-actions { margin-left: auto; }
  }
  .invoice__sheet {
    max-width: 210mm;
    margin: 0 auto 24px;
    background: #fff;
    border: 1px solid #111;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }
  .invoice__header {
    display: table;
    width: 100%;
    border-bottom: 1px solid #111;
  }
  .invoice__brand,
  .invoice__title-block {
    display: table-cell;
    vertical-align: top;
    padding: 16px 18px;
  }
  .invoice__brand { width: 58%; border-right: 1px solid #111; }
  .invoice__title-block {
    width: 42%;
    text-align: right;
    background: #f7f7f7;
  }
  .invoice__logo {
    display: block;
    height: 48px;
    width: auto;
    max-width: 200px;
    object-fit: contain;
  }
  .invoice__logo--svg { height: 32px; max-width: 140px; }
  .invoice__logo-text {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #111;
  }
  .invoice__brand-tagline {
    margin: 8px 0 0;
    font-size: 10px;
    color: #444;
    max-width: 320px;
  }
  .invoice__brand-meta {
    margin: 10px 0 0;
    font-size: 10px;
    color: #333;
    line-height: 1.5;
  }
  .invoice__doc-label {
    margin: 0 0 4px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #555;
  }
  .invoice__doc-title {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #111;
  }
  .invoice__copy-badge {
    display: inline-block;
    padding: 4px 10px;
    border: 1px solid #111;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: #fff;
  }
  .invoice__meta-table,
  .invoice__party-table,
  .invoice__items,
  .invoice__totals,
  .invoice__tax-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .invoice__meta-table td,
  .invoice__party-table th,
  .invoice__party-table td,
  .invoice__items th,
  .invoice__items td,
  .invoice__totals td,
  .invoice__tax-table th,
  .invoice__tax-table td {
    border: 1px solid #111;
    padding: 7px 10px;
    vertical-align: top;
    word-break: break-word;
  }
  .invoice__meta-table .label {
    width: 18%;
    background: #f3f3f3;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #333;
  }
  .invoice__meta-table .value {
    width: 32%;
    font-size: 11px;
    font-weight: 600;
    color: #111;
  }
  .invoice__parties {
    display: table;
    width: 100%;
    border-bottom: 1px solid #111;
  }
  .invoice__party-cell {
    display: table-cell;
    width: 50%;
    vertical-align: top;
  }
  .invoice__party-cell:first-child { border-right: 1px solid #111; }
  .invoice__party-table { border: 0; }
  .invoice__party-table th {
    background: #111;
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-align: left;
    padding: 8px 10px;
    border: 0;
    border-bottom: 1px solid #111;
  }
  .invoice__party-table td {
    border: 0;
    border-bottom: 1px solid #d4d4d4;
    font-size: 10px;
    line-height: 1.55;
    color: #222;
  }
  .invoice__party-table tr:last-child td { border-bottom: 0; }
  .invoice__party-name {
    font-size: 11px;
    font-weight: 700;
    color: #111;
  }
  .invoice__items th {
    background: #111;
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: left;
  }
  .invoice__items th.num,
  .invoice__items td.num { text-align: right; }
  .invoice__items th.center,
  .invoice__items td.center { text-align: center; }
  .invoice__items tbody tr:nth-child(even) td { background: #fafafa; }
  .invoice__item-title { font-weight: 700; color: #111; }
  .invoice__item-sub { margin-top: 2px; font-size: 9px; color: #555; }
  .invoice__summary {
    display: table;
    width: 100%;
    border-top: 1px solid #111;
  }
  .invoice__summary-words,
  .invoice__summary-totals {
    display: table-cell;
    vertical-align: top;
  }
  .invoice__summary-words {
    width: 58%;
    border-right: 1px solid #111;
    padding: 12px 14px;
    background: #f9f9f9;
  }
  .invoice__summary-totals { width: 42%; }
  .invoice__summary-heading {
    margin: 0 0 6px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #444;
  }
  .invoice__summary-text {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    color: #111;
    line-height: 1.5;
  }
  .invoice__totals td {
    border-left: 0;
    border-right: 0;
    padding: 7px 12px;
    font-size: 11px;
  }
  .invoice__totals tr:first-child td { border-top: 0; }
  .invoice__totals td:first-child { color: #333; }
  .invoice__totals td:last-child {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  .invoice__totals tr.grand td {
    background: #111;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    border-color: #111;
  }
  .invoice__tax-section {
    border-top: 1px solid #111;
    padding: 0;
  }
  .invoice__tax-heading {
    margin: 0;
    padding: 8px 12px;
    background: #f3f3f3;
    border-bottom: 1px solid #111;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #333;
  }
  .invoice__tax-table th {
    background: #f3f3f3;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: left;
  }
  .invoice__tax-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .invoice__payment {
    border-top: 1px solid #111;
    padding: 12px 14px;
    background: #fff;
  }
  .invoice__payment-title {
    margin: 0 0 4px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #111;
  }
  .invoice__payment-text {
    margin: 0;
    font-size: 10px;
    color: #333;
    line-height: 1.55;
  }
  .invoice__status {
    display: inline-block;
    margin-top: 6px;
    padding: 3px 8px;
    border: 1px solid #111;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .invoice__status--paid { background: #111; color: #fff; }
  .invoice__status--cod { background: #fff; color: #111; }
  .invoice__notes {
    border-top: 1px solid #111;
    padding: 12px 14px;
    background: #fafafa;
    font-size: 9px;
    color: #444;
    line-height: 1.65;
  }
  .invoice__notes p { margin: 0 0 6px; }
  .invoice__notes strong { color: #111; }
  .invoice__footer {
    border-top: 1px solid #111;
    padding: 10px 14px;
    text-align: center;
    font-size: 8px;
    color: #666;
    line-height: 1.6;
    background: #f7f7f7;
  }
  .invoice__footer p { margin: 0 0 3px; }
  @media (max-width: 720px) {
    .invoice__header,
    .invoice__parties,
    .invoice__summary {
      display: block;
    }
    .invoice__brand,
    .invoice__title-block,
    .invoice__party-cell,
    .invoice__summary-words,
    .invoice__summary-totals {
      display: block;
      width: 100%;
      border-right: 0;
    }
    .invoice__brand { border-bottom: 1px solid #111; }
    .invoice__party-cell:first-child { border-bottom: 1px solid #111; }
    .invoice__summary-words { border-bottom: 1px solid #111; }
    .invoice__meta-table .label,
    .invoice__meta-table .value { display: block; width: 100%; }
  }
  @media print {
    .invoice__items tbody tr:nth-child(even) td { background: #fff; }
    .invoice__totals tr.grand td { background: #f0f0f0; color: #111; }
    /* Compact spacing so the invoice fits on a single A4 sheet */
    .invoice__brand,
    .invoice__title-block { padding: 10px 12px; }
    .invoice__logo { height: 38px; }
    .invoice__brand-tagline { margin: 5px 0 0; font-size: 9px; }
    .invoice__brand-meta { margin: 6px 0 0; font-size: 9px; line-height: 1.4; }
    .invoice__doc-title { margin: 0 0 5px; font-size: 18px; }
    .invoice__meta-table td,
    .invoice__party-table th,
    .invoice__party-table td,
    .invoice__items th,
    .invoice__items td,
    .invoice__totals td,
    .invoice__tax-table th,
    .invoice__tax-table td { padding: 4px 8px; }
    .invoice__party-table th { padding: 5px 8px; }
    .invoice__totals td { padding: 4px 10px; font-size: 10px; }
    .invoice__totals tr.grand td { font-size: 11px; }
    .invoice__summary-words { padding: 8px 10px; }
    .invoice__tax-heading { padding: 5px 10px; }
    .invoice__payment { padding: 8px 10px; }
    .invoice__payment-text { font-size: 9px; line-height: 1.4; }
    .invoice__status { margin-top: 4px; }
    .invoice__notes { padding: 8px 10px; font-size: 8px; line-height: 1.5; }
    .invoice__notes p { margin: 0 0 4px; }
    .invoice__footer { padding: 6px 10px; font-size: 7px; line-height: 1.45; }
    .invoice__footer p { margin: 0 0 2px; }
    .invoice__header,
    .invoice__parties,
    .invoice__meta-table,
    .invoice__summary,
    .invoice__tax-section,
    .invoice__payment,
    .invoice__notes,
    .invoice__footer { break-inside: avoid; page-break-inside: avoid; }
    .invoice__items tr { break-inside: avoid; page-break-inside: avoid; }
  }
`;

function renderTaxRows(data: InvoiceViewModel): string {
  if (data.totalGst <= 0) return "";

  const taxRows = data.isInterState
    ? `<tr>
        <td>IGST @ ${data.igstRate ?? 0}%</td>
        <td class="num">${formatInr(data.totalTaxable)}</td>
        <td class="num">${formatInr(data.totalIgst)}</td>
      </tr>`
    : `<tr>
        <td>CGST @ ${data.cgstRate ?? 0}%</td>
        <td class="num">${formatInr(data.totalTaxable)}</td>
        <td class="num">${formatInr(data.totalCgst)}</td>
      </tr>
      <tr>
        <td>SGST @ ${data.sgstRate ?? 0}%</td>
        <td class="num">${formatInr(data.totalTaxable)}</td>
        <td class="num">${formatInr(data.totalSgst)}</td>
      </tr>`;

  return `
    <section class="invoice__tax-section">
      <p class="invoice__tax-heading">Tax Summary — ${data.isInterState ? "Inter-state supply (IGST)" : "Intra-state supply (CGST + SGST)"}</p>
      <table class="invoice__tax-table">
        <thead>
          <tr>
            <th>Tax type</th>
            <th class="num">Taxable value</th>
            <th class="num">Tax amount</th>
          </tr>
        </thead>
        <tbody>
          ${taxRows}
          <tr>
            <td><strong>Total GST</strong></td>
            <td class="num"></td>
            <td class="num"><strong>${formatInr(data.totalGst)}</strong></td>
          </tr>
        </tbody>
      </table>
    </section>`;
}

function renderInvoiceBody(data: InvoiceViewModel, logo: string): string {
  const rows = data.items
    .map(
      (item) => `
        <tr>
          <td class="center">${item.index}</td>
          <td>
            <div class="invoice__item-title">${escapeHtml(item.title)}</div>
            ${item.subtitle ? `<div class="invoice__item-sub">${escapeHtml(item.subtitle)}</div>` : ""}
          </td>
          <td class="center">${item.quantity}</td>
          <td class="num">${formatInr(item.unitPrice)}</td>
          <td class="num">${formatInr(item.taxableAmount)}</td>
          <td class="center">${item.gstRate}%</td>
          <td class="num">${formatInr(item.gstAmount)}</td>
          <td class="num">${formatInr(item.lineTotal)}</td>
        </tr>`
    )
    .join("");

  const discountRow = data.discount
    ? `<tr><td>Discount${data.discountCode ? ` (${escapeHtml(data.discountCode)})` : ""}</td><td>− ${formatInr(data.discount)}</td></tr>`
    : "";

  const platformFeeRow =
    data.platformFee > 0
      ? `<tr><td>Platform fee</td><td>${formatInr(data.platformFee)}</td></tr>`
      : "";

  const customerAddress = data.customer.addressLines
    .map((line) => escapeHtml(line))
    .join("<br/>");

  const sellerGstin = data.seller.gstin
    ? `<strong>GSTIN:</strong> ${escapeHtml(data.seller.gstin)}<br/>`
    : "";

  const statusClass =
    data.statusLabel.toLowerCase().includes("paid") ? "invoice__status--paid" : "invoice__status--cod";

  return `
    <div class="invoice__sheet">
      <header class="invoice__header">
        <div class="invoice__brand">
          ${logo}
          <p class="invoice__brand-tagline">Musical instruments, pro audio, accessories &amp; more — shipped across India.</p>
          <p class="invoice__brand-meta">
            ${sellerGstin}
            <strong>State:</strong> ${escapeHtml(data.seller.state)}<br/>
            ${escapeHtml(data.seller.email)} · ${escapeHtml(data.seller.phone)}<br/>
            ${escapeHtml(data.seller.website)}
          </p>
        </div>
        <div class="invoice__title-block">
          <p class="invoice__doc-label">Tax document</p>
          <h1 class="invoice__doc-title">Tax Invoice</h1>
          <span class="invoice__copy-badge">Original for Recipient</span>
        </div>
      </header>

      <table class="invoice__meta-table" aria-label="Invoice metadata">
        <tbody>
          <tr>
            <td class="label">Invoice No.</td>
            <td class="value">${escapeHtml(data.invoiceNumber)}</td>
            <td class="label">Order No.</td>
            <td class="value">${escapeHtml(data.orderId)}</td>
          </tr>
          <tr>
            <td class="label">Invoice Date</td>
            <td class="value">${escapeHtml(data.invoiceDate)}</td>
            <td class="label">Order Date</td>
            <td class="value">${escapeHtml(data.orderDate)}</td>
          </tr>
          <tr>
            <td class="label">Payment Mode</td>
            <td class="value">${escapeHtml(data.paymentLabel)}</td>
            <td class="label">Place of Supply</td>
            <td class="value">${escapeHtml(data.placeOfSupply)}</td>
          </tr>
        </tbody>
      </table>

      <div class="invoice__parties">
        <div class="invoice__party-cell">
          <table class="invoice__party-table">
            <thead><tr><th colspan="2">Sold By</th></tr></thead>
            <tbody>
              <tr>
                <td colspan="2">
                  <span class="invoice__party-name">${escapeHtml(data.seller.name)}</span><br/>
                  ${escapeHtml(data.seller.address)}<br/>
                  ${sellerGstin}
                  ${escapeHtml(data.seller.email)} · ${escapeHtml(data.seller.phone)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="invoice__party-cell">
          <table class="invoice__party-table">
            <thead><tr><th colspan="2">Bill To / Ship To</th></tr></thead>
            <tbody>
              <tr>
                <td colspan="2">
                  <span class="invoice__party-name">${escapeHtml(data.customer.name)}</span><br/>
                  ${customerAddress}<br/>
                  <strong>State:</strong> ${escapeHtml(data.customer.state)}<br/>
                  ${escapeHtml(data.customer.email)}${data.customer.phone ? ` · ${escapeHtml(data.customer.phone)}` : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <table class="invoice__items">
        <caption class="visually-hidden">Items purchased (${data.itemCount})</caption>
        <thead>
          <tr>
            <th class="center" style="width:4%">Sl.</th>
            <th style="width:34%">Description of Goods</th>
            <th class="center" style="width:6%">Qty</th>
            <th class="num" style="width:12%">Unit Price</th>
            <th class="num" style="width:12%">Taxable Value</th>
            <th class="center" style="width:6%">GST</th>
            <th class="num" style="width:12%">Tax Amt.</th>
            <th class="num" style="width:14%">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="invoice__summary">
        <div class="invoice__summary-words">
          <p class="invoice__summary-heading">Amount Chargeable (in words)</p>
          <p class="invoice__summary-text">${escapeHtml(data.totalInWords)}</p>
        </div>
        <div class="invoice__summary-totals">
          <table class="invoice__totals" aria-label="Order totals">
            <tbody>
              <tr><td>Subtotal</td><td>${formatInr(data.subtotal)}</td></tr>
              ${discountRow}
              <tr><td>Shipping</td><td>${data.shipping === 0 ? "FREE" : formatInr(data.shipping)}</td></tr>
              ${platformFeeRow}
              ${data.totalGst > 0 ? `<tr><td>Total GST</td><td>${formatInr(data.totalGst)}</td></tr>` : ""}
              <tr class="grand"><td>Grand Total</td><td>${formatInr(data.total)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      ${renderTaxRows(data)}

      <section class="invoice__payment">
        <p class="invoice__payment-title">Payment Information</p>
        <p class="invoice__payment-text">${escapeHtml(data.paymentNote)}</p>
        <span class="invoice__status ${statusClass}">${escapeHtml(data.statusLabel)}</span>
      </section>

      <section class="invoice__notes">
        <p><strong>Delivery:</strong> Shipment will be dispatched to the address mentioned above. Tracking details will be shared via email and SMS once the order ships.</p>
        <p><strong>Returns &amp; Warranty:</strong> For returns, exchanges, or warranty claims, contact support within 7 days of delivery with your order ID and invoice number.</p>
        <p><strong>Customer Support:</strong> ${escapeHtml(data.seller.email)} · ${escapeHtml(data.seller.phone)} · ${escapeHtml(data.seller.website)}</p>
      </section>

      <footer class="invoice__footer">
        <p>This is a computer-generated tax invoice and is valid without a physical signature.</p>
        <p>Subject to Mumbai jurisdiction, India. E. &amp; O.E.</p>
        <p>© ${new Date().getFullYear()} ${escapeHtml(data.seller.name)} · ${escapeHtml(data.seller.website)}</p>
      </footer>
    </div>
  `;
}

function sanitizeReturnTo(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return undefined;
  return trimmed;
}

export function generateInvoiceHtml(
  order: Order,
  seller?: InvoiceSellerMeta,
  options?: {
    autoPrint?: boolean;
    showActions?: boolean;
    downloadUrl?: string;
    returnTo?: string;
  }
): string {
  const data = buildViewModel(order, seller);
  const logo = readLogoMarkup();
  const body = renderInvoiceBody(data, logo);
  const showActions = options?.showActions !== false;
  const returnTo = sanitizeReturnTo(options?.returnTo);

  const downloadAction = options?.downloadUrl
    ? `<a href="${escapeHtml(options.downloadUrl)}" download>Download PDF</a>`
    : "";

  const navScript = `<script>
function invoiceGoBack(){
  var returnTo=${JSON.stringify(returnTo ?? "")};
  if(returnTo){window.location.href=returnTo;return;}
  if(window.history.length>1){window.history.back();return;}
  window.location.href="/account/orders";
}
</script>`;

  const actions = showActions
    ? `<header class="invoice__toolbar no-print">
        <div class="invoice__toolbar-nav">
          <button type="button" class="invoice__toolbar-back" onclick="invoiceGoBack()">← Back</button>
          <button type="button" class="invoice__toolbar-cancel" onclick="invoiceGoBack()">Cancel</button>
        </div>
        <div class="invoice__toolbar-actions">
          <button type="button" onclick="window.print()">Print Invoice</button>
          ${downloadAction}
        </div>
      </header>${navScript}`
    : "";

  const printScript = options?.autoPrint
    ? `<script>window.addEventListener("load",function(){window.print();});</script>`
    : "";

  const visuallyHiddenCss = `.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Tax Invoice ${escapeHtml(data.invoiceNumber)} — ${escapeHtml(data.seller.name)}</title>
  <style>${INVOICE_CSS}${visuallyHiddenCss}</style>
</head>
<body>
  ${actions}
  ${body}
  ${printScript}
</body>
</html>`;
}

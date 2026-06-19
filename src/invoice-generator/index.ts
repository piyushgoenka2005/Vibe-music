import type { InvoiceOrder } from "./invoice-types";
import {
  INVOICE_BRAND,
  INVOICE_SELLER,
  amountInWordsInr,
  formatInvoiceDate,
  formatInvoiceDateTime,
  gstSupplyType,
  invoicePaymentDateLabel,
  invoiceStatusBadge,
  paymentMethodLabel,
  type InvoiceSeller,
} from "./invoice-utils";
import { formatPrice } from "./format";

export type { InvoiceItem, InvoiceOrder } from "./invoice-types";

export function generateInvoiceHtml(
  order: InvoiceOrder,
  opts?: { title?: string; seller?: InvoiceSeller }
): string {
  const seller = opts?.seller ?? order.seller ?? INVOICE_SELLER;
  const isIntraState = order.totals.isInterState === false || order.totals.igst === 0;
  const status = invoiceStatusBadge(order);
  const brand = INVOICE_BRAND;

  const statusBg =
    status.tone === "paid"
      ? "rgba(18,83,237,0.12)"
      : status.tone === "cod"
        ? "rgba(255,222,89,0.35)"
        : "rgba(100,116,139,0.15)";

  const css = `
    :root {
      --brand: ${brand.primary};
      --brand-dark: ${brand.primaryDark};
      --white: ${brand.white};
      --text: ${brand.text};
      --muted: ${brand.muted};
      --border: ${brand.border};
      --subtle: ${brand.subtle};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 28px 16px;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: var(--text);
      background: var(--white);
    }
    .invoice {
      max-width: 820px;
      margin: 0 auto;
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(18, 83, 237, 0.08);
    }
    .accent { height: 5px; background: linear-gradient(90deg, var(--brand), #0CC0DF); }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      padding: 24px 24px 0;
    }
    .brand-name { margin: 0; color: var(--brand); font-size: 1.35rem; font-weight: 700; }
    .brand-tag { color: var(--muted); font-size: 13px; margin-top: 4px; }
    .doc-title {
      text-transform: uppercase;
      color: var(--brand);
      font-weight: 700;
      letter-spacing: 0.06em;
      font-size: 12px;
    }
    .status-pill {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      background: ${statusBg};
      color: var(--brand-dark);
    }
    .meta-grid {
      margin: 20px 24px 0;
      background: var(--subtle);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .meta-label { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    .meta-value { font-weight: 600; margin-top: 4px; font-size: 13px; }
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      padding: 20px 24px 0;
    }
    .party-title { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
    .party-name { font-weight: 700; color: var(--brand-dark); }
    .party-lines { color: var(--muted); font-size: 13px; line-height: 1.55; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13px; }
    th { background: rgba(18, 83, 237, 0.06); color: var(--brand-dark); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    .right { text-align: right; }
    .muted { color: var(--muted); }
    .table-wrap { padding: 20px 24px 0; }
    .footer-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      padding: 20px 24px 24px;
    }
    .words-box {
      background: var(--subtle);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 12px;
      margin-top: 6px;
      font-size: 13px;
      line-height: 1.5;
    }
    .totals { min-width: 280px; display: flex; flex-direction: column; gap: 6px; }
    .total-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
    .grand-total {
      margin-top: 8px;
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--brand);
      color: var(--white);
      font-weight: 700;
      display: flex;
      justify-content: space-between;
    }
    .invoice-footer {
      border-top: 1px solid var(--border);
      padding: 14px 24px 18px;
      text-align: center;
      color: var(--muted);
      font-size: 12px;
      background: var(--subtle);
    }
    .invoice-footer a { color: var(--brand); text-decoration: none; }
    @media (max-width: 640px) {
      .meta-grid, .parties { grid-template-columns: 1fr; }
      .footer-section { flex-direction: column; }
    }
  `;

  const itemsHtml = order.items
    .map(
      (item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(item.title)}</td>
      <td class="muted">${escapeHtml(item.hsnCode ?? "—")}</td>
      <td class="right">${item.quantity}</td>
      <td class="right">${formatPrice(item.unitPrice)}</td>
      <td class="right">${formatPrice(item.lineTotal)}</td>
    </tr>`
    )
    .join("\n");

  const cgstLabel = order.totals.cgstRate
    ? `CGST @ ${order.totals.cgstRate}%`
    : "CGST";
  const sgstLabel = order.totals.sgstRate
    ? `SGST @ ${order.totals.sgstRate}%`
    : "SGST";
  const igstLabel = order.totals.igstRate
    ? `IGST @ ${order.totals.igstRate}%`
    : "IGST";

  const taxRows = isIntraState
    ? `<div class="total-row"><span class="muted">${cgstLabel}</span><span>${formatPrice(order.totals.cgst)}</span></div>
       <div class="total-row"><span class="muted">${sgstLabel}</span><span>${formatPrice(order.totals.sgst)}</span></div>`
    : `<div class="total-row"><span class="muted">${igstLabel}</span><span>${formatPrice(order.totals.igst)}</span></div>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(opts?.title ?? `Invoice ${order.invoiceNumber}`)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="invoice">
    <div class="accent"></div>
    <header class="header">
      <div>
        <h1 class="brand-name">${escapeHtml(seller.name)}</h1>
        <div class="brand-tag">${escapeHtml(seller.tagline ?? "")}</div>
        <div class="brand-tag">${escapeHtml(seller.email)} · ${escapeHtml(seller.phone)}</div>
        ${seller.gstin ? `<div class="brand-tag">GSTIN: ${escapeHtml(seller.gstin)}</div>` : ""}
      </div>
      <div style="text-align:right">
        <div class="doc-title">Tax Invoice</div>
        <span class="status-pill">${status.label}</span>
        <div class="muted" style="margin-top:8px;font-size:12px">${gstSupplyType(isIntraState)}</div>
      </div>
    </header>

    <section class="meta-grid">
      <div><div class="meta-label">Invoice No.</div><div class="meta-value">${escapeHtml(order.invoiceNumber)}</div></div>
      <div><div class="meta-label">Order ID</div><div class="meta-value" style="font-family:monospace">${escapeHtml(order.id)}</div></div>
      <div><div class="meta-label">Invoice Date</div><div class="meta-value">${formatInvoiceDate(order.createdAt)}</div></div>
      <div><div class="meta-label">Payment</div><div class="meta-value">${invoicePaymentDateLabel(order)}</div></div>
    </section>

    <section class="parties">
      <div>
        <div class="party-title">Sold by</div>
        <div class="party-name">${escapeHtml(seller.legalName)}</div>
        <div class="party-lines">${escapeHtml(seller.address)}</div>
      </div>
      <div>
        <div class="party-title">Bill to &amp; Ship to</div>
        <div class="party-name">${escapeHtml(order.shipping.fullName)}</div>
        <div class="party-lines">
          ${escapeHtml(order.shipping.addressLine1)}${order.shipping.addressLine2 ? `, ${escapeHtml(order.shipping.addressLine2)}` : ""}<br/>
          ${escapeHtml(order.shipping.city)}, ${escapeHtml(order.shipping.state)} ${escapeHtml(order.shipping.pincode ?? "")}<br/>
          ${escapeHtml(order.shipping.country ?? "India")}
          ${order.shipping.email ? `<br/>${escapeHtml(order.shipping.email)}` : ""}
          ${order.shipping.phone ? ` · ${escapeHtml(order.shipping.phone)}` : ""}
        </div>
      </div>
    </section>

    <section class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>HSN</th>
            <th class="right">Qty</th>
            <th class="right">Rate</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </section>

    <section class="footer-section">
      <div style="max-width:52%">
        <div class="meta-label">Amount in words</div>
        <div class="words-box">${escapeHtml(amountInWordsInr(order.totals.grandTotal))}</div>
        <div style="margin-top:14px;font-weight:700;color:var(--brand)">Payment</div>
        <div class="muted" style="font-size:13px;margin-top:4px">Method: ${paymentMethodLabel(order.payment.method)}</div>
        ${order.payment.paidAt ? `<div class="muted" style="font-size:13px">Paid at: ${formatInvoiceDateTime(order.payment.paidAt)}</div>` : ""}
        ${order.payment.razorpayPaymentId ? `<div class="muted" style="font-size:12px;margin-top:4px">Ref: ${escapeHtml(order.payment.razorpayPaymentId)}</div>` : ""}
      </div>
      <div class="totals">
        <div class="total-row"><span class="muted">Subtotal</span><span>${formatPrice(order.totals.subtotal)}</span></div>
        ${order.totals.discount ? `<div class="total-row"><span class="muted">Discount (${escapeHtml(order.totals.discountCode ?? "")})</span><span>− ${formatPrice(order.totals.discount)}</span></div>` : ""}
        <div class="total-row"><span class="muted">Shipping</span><span>${order.totals.shipping === 0 ? "Free" : formatPrice(order.totals.shipping)}</span></div>
        ${order.totals.giftWrap ? `<div class="total-row"><span class="muted">Gift wrap</span><span>${formatPrice(order.totals.giftWrap)}</span></div>` : ""}
        <div class="total-row"><span class="muted">Taxable value</span><span>${formatPrice(order.totals.taxableAmount)}</span></div>
        ${taxRows}
        <div class="grand-total"><span>Total</span><span>${formatPrice(order.totals.grandTotal)}</span></div>
      </div>
    </section>

    <footer class="invoice-footer">
      Computer-generated tax invoice · No signature required · Subject to Mumbai jurisdiction ·
      <a href="mailto:${escapeHtml(seller.email)}">${escapeHtml(seller.email)}</a>
    </footer>
  </div>
  <script>
    (function () {
      function postHeight() {
        var h = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        );
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "vibe-invoice-height", height: h }, window.location.origin);
        }
      }
      window.addEventListener("load", postHeight);
      window.addEventListener("resize", postHeight);
      postHeight();
    })();
  </script>
</body>
</html>`;
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

export {
  INVOICE_BRAND,
  INVOICE_SELLER,
  amountInWordsInr,
  formatInvoiceDate,
  formatInvoiceDateTime,
  paymentMethodLabel,
} from "./invoice-utils";
export { formatPrice } from "./format";
export { mapVibeOrderToInvoiceOrder, mapSellerMeta } from "./mapVibeOrder";

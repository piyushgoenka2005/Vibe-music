import type { Order } from "@/types/order";
import type { GSTInvoiceData } from "@/lib/gstCalculator";
import { INVOICE_BRAND, amountInWordsInr, formatInvoiceDateTime, paymentMethodLabel, gstSupplyType, invoiceStatusBadge } from "@/features/invoice/utils/invoice-utils";
import { formatPrice } from "@/features/invoice/utils/format";
import type { InvoiceSellerMeta } from "@/features/invoice/types";

function safeText(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMaybePercent(rate: number): string {
  const r = Number(rate);
  if (!Number.isFinite(r)) return "";
  return `${r}%`;
}

function renderTaxRows(invoice: GSTInvoiceData): { cgst: number; sgst: number; igst: number } {
  return { cgst: invoice.totalCgst, sgst: invoice.totalSgst, igst: invoice.totalIgst };
}

export function generateInvoiceHtml(
  order: Order,
  seller: InvoiceSellerMeta
): string {
  const invoice = order.invoice;
  if (!invoice) {
    throw new Error("Order invoice data missing");
  }

  const status = invoiceStatusBadge(order);
  const paidAt = order.paymentCompletedAt ?? invoice.invoiceDate;

  const { cgst, sgst, igst } = renderTaxRows(invoice);
  const supplyTypeLabel = gstSupplyType(invoice.isInterState);

  const amountInWords = amountInWordsInr(invoice.grandTotal);
  const paymentMethod = paymentMethodLabel(order.paymentMethod);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Tax Invoice ${safeText(invoice.invoiceNumber)}</title>
    <style>
      :root{
        --brand:${INVOICE_BRAND.teal};
        --brand-dark:${INVOICE_BRAND.tealDark};
        --muted:#667085;
        --text:#0f172a;
        --border:#e5e7eb;
        --bg:#ffffff;
        --subtle:#f8fafc;
        --gold:${INVOICE_BRAND.gold};
      }
      *{ box-sizing:border-box; }
      body{
        margin:0;
        padding:32px 18px;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue", "Noto Sans", "Liberation Sans", sans-serif;
        color:var(--text);
        background:var(--bg);
      }
      .page{
        max-width:860px;
        margin:0 auto;
      }
      .topbar{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:18px;
        border:1px solid var(--border);
        border-radius:14px;
        padding:18px 18px;
      }
      .brand{
        display:flex;
        flex-direction:column;
        gap:6px;
        min-width:280px;
      }
      .brand__name{
        font-size:22px;
        font-weight:800;
        letter-spacing:-0.02em;
      }
      .brand__tag{
        color:var(--muted);
        font-size:12px;
      }
      .meta-grid{
        display:grid;
        grid-template-columns: 1fr 1fr;
        gap:10px 18px;
        min-width:320px;
        align-content:start;
      }
      .meta{
        border-left:3px solid var(--brand);
        padding-left:10px;
      }
      .meta__label{
        font-size:11px;
        color:var(--muted);
        text-transform:uppercase;
        letter-spacing:0.08em;
        margin-bottom:4px;
      }
      .meta__value{
        font-size:13px;
        font-weight:700;
      }
      .section-title{
        margin:22px 0 10px;
        font-size:14px;
        text-transform:uppercase;
        letter-spacing:0.1em;
        color:var(--muted);
      }
      .two-col{
        display:grid;
        grid-template-columns: 1fr 1fr;
        gap:14px;
      }
      .box{
        border:1px solid var(--border);
        border-radius:14px;
        padding:14px;
        background:var(--subtle);
      }
      .box h3{
        margin:0 0 10px;
        font-size:12px;
        text-transform:uppercase;
        letter-spacing:0.08em;
        color:var(--muted);
      }
      .box p{
        margin:0;
        font-size:13px;
        line-height:1.45;
        font-weight:500;
      }
      .badge{
        display:inline-flex;
        align-items:center;
        padding:6px 10px;
        border-radius:999px;
        font-size:12px;
        font-weight:800;
        border:1px solid rgba(18,83,237,0.18);
        color:var(--brand);
        background: rgba(18,83,237,0.08);
      }
      .badge--cod{
        border-color: rgba(180,83,0,0.35);
        background: rgba(180,83,0,0.08);
        color:#a16207;
      }
      table{
        width:100%;
        border-collapse:collapse;
        margin-top:12px;
      }
      thead th{
        text-align:left;
        font-size:11px;
        color:var(--muted);
        text-transform:uppercase;
        letter-spacing:0.08em;
        padding:10px 10px;
        border-bottom:1px solid var(--border);
      }
      tbody td{
        padding:10px 10px;
        border-bottom:1px solid var(--border);
        font-size:13px;
        vertical-align:top;
      }
      .num{ text-align:right; white-space:nowrap; }
      .muted{ color:var(--muted); font-weight:600; }
      .summary{
        margin-top:18px;
        display:grid;
        grid-template-columns: 1fr 290px;
        gap:14px;
      }
      .words{
        border:1px dashed rgba(18,83,237,0.35);
        border-radius:14px;
        padding:12px;
        background:rgba(18,83,237,0.04);
      }
      .words__label{
        margin:0 0 6px;
        font-size:11px;
        color:var(--muted);
        text-transform:uppercase;
        letter-spacing:0.08em;
      }
      .words__value{
        margin:0;
        font-size:13px;
        font-weight:700;
        line-height:1.35;
      }
      .totals{
        border:1px solid var(--border);
        border-radius:14px;
        overflow:hidden;
      }
      .totals-row{
        display:flex;
        justify-content:space-between;
        gap:10px;
        padding:10px 12px;
        border-bottom:1px solid var(--border);
        font-size:13px;
        font-weight:600;
      }
      .totals-row:last-child{ border-bottom:none; }
      .totals-row--grand{
        background:linear-gradient(90deg, rgba(18,83,237,0.10), rgba(18,83,237,0.02));
      }
      .totals-row--grand .label{ font-size:13px; font-weight:900; }
      .footer{
        margin-top:18px;
        padding-top:12px;
        border-top:1px solid var(--border);
        color:var(--muted);
        font-size:12px;
        line-height:1.4;
      }
      @media print{
        body{ padding:0; background:#fff; }
        .page{ max-width: none; margin:0; }
        .badge{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="topbar">
        <div class="brand">
          <div class="brand__name">${safeText(seller.storeName)}</div>
          <div class="brand__tag">${safeText(seller.tagline ?? "")}</div>
          <p style="margin:0; font-size:12px; color:var(--muted); font-weight:600;">
            GSTIN: ${safeText(seller.gstin ?? "N/A")} · PAN: ${safeText(seller.pan ?? "N/A")} · State: ${safeText(seller.state)}
          </p>
          <p style="margin:0; font-size:12px; color:var(--muted); font-weight:600;">
            ${safeText(seller.address)}
          </p>
          <p style="margin:0; font-size:12px; color:var(--muted); font-weight:600;">
            ${safeText(seller.email)} · ${safeText(seller.phone)}
          </p>
        </div>
        <div class="meta-grid">
          <div class="meta">
            <div class="meta__label">Invoice Number</div>
            <div class="meta__value">${safeText(invoice.invoiceNumber)}</div>
          </div>
          <div class="meta">
            <div class="meta__label">Invoice Date</div>
            <div class="meta__value">${safeText(formatInvoiceDateTime(invoice.invoiceDate))}</div>
          </div>
          <div class="meta">
            <div class="meta__label">Payment</div>
            <div class="meta__value">
              <span class="badge ${status.tone === "cod" ? "badge--cod" : ""}">
                ${safeText(status.label)}
              </span>
            </div>
          </div>
          <div class="meta">
            <div class="meta__label">Payment Method</div>
            <div class="meta__value">${safeText(paymentMethod)}</div>
          </div>
        </div>
      </div>

      <div class="section-title">Tax Invoice</div>

      <div class="two-col">
        <div class="box">
          <h3>Seller</h3>
          <p>
            <strong>${safeText(seller.legalName)}</strong><br/>
            ${safeText(seller.address)}<br/>
            GSTIN: ${safeText(seller.gstin ?? "N/A")}<br/>
            State: ${safeText(seller.state)} (${safeText(seller.stateCode || "")})
          </p>
        </div>
        <div class="box">
          <h3>Buyer (Ship To)</h3>
          <p>
            <strong>${safeText(order.shippingAddress.name)}</strong><br/>
            ${safeText(order.shippingAddress.line1)}${order.shippingAddress.line2 ? `<br/>${safeText(order.shippingAddress.line2)}` : ""}<br/>
            ${safeText(order.shippingAddress.city)}, ${safeText(order.shippingAddress.state)} ${safeText(order.shippingAddress.postalCode)}<br/>
            ${safeText(order.shippingAddress.country)}<br/>
            Phone: ${safeText(order.shippingAddress.phone ?? "N/A")}
          </p>
        </div>
      </div>

      <div class="section-title">Items & GST Breakdown</div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="num">Qty</th>
            <th class="num">Taxable</th>
            <th>GST</th>
            <th class="num">GST Amount</th>
            <th class="num">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lineBreakdown.map((line) => {
            const gst = invoice.isInterState
              ? `IGST ${formatMaybePercent(line.gstRate)}`
              : `CGST ${formatMaybePercent(line.gstRate / 2)} + SGST ${formatMaybePercent(line.gstRate / 2)}`;
            return `<tr>
              <td>${safeText(line.name)}</td>
              <td class="num">${safeText(line.quantity)}</td>
              <td class="num">${safeText(formatPrice(line.taxableAmount))}</td>
              <td class="muted">${safeText(gst)}</td>
              <td class="num">${safeText(formatPrice(line.gstAmount))}</td>
              <td class="num"><strong>${safeText(formatPrice(line.lineTotal))}</strong></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>

      <div class="summary">
        <div class="words">
          <p class="words__label">Amount in words (INR)</p>
          <p class="words__value">${safeText(amountInWords)}</p>
        </div>
        <div class="totals">
          <div class="totals-row">
            <span class="label muted">Subtotal</span>
            <span class="value">${safeText(formatPrice(invoice.subtotal))}</span>
          </div>
          ${
            invoice.couponDiscount > 0
              ? `<div class="totals-row">
            <span class="label muted">Discount</span>
            <span class="value">−${safeText(formatPrice(invoice.couponDiscount))}</span>
          </div>`
              : ""
          }
          <div class="totals-row">
            <span class="label muted">Shipping</span>
            <span class="value">${invoice.shippingCharge === 0 ? "FREE" : safeText(formatPrice(invoice.shippingCharge))}</span>
          </div>
          ${
            invoice.isInterState
              ? `<div class="totals-row">
            <span class="label muted">IGST (${invoice.igstDisplayRate}%)</span>
            <span class="value">${safeText(formatPrice(igst))}</span>
          </div>`
              : `<div class="totals-row">
            <span class="label muted">CGST (${invoice.cgstDisplayRate}%)</span>
            <span class="value">${safeText(formatPrice(cgst))}</span>
          </div>
          <div class="totals-row">
            <span class="label muted">SGST (${invoice.sgstDisplayRate}%)</span>
            <span class="value">${safeText(formatPrice(sgst))}</span>
          </div>`
          }
          <div class="totals-row totals-row--grand">
            <span class="label">Grand Total</span>
            <span class="value"><strong>${safeText(formatPrice(invoice.grandTotal))}</strong></span>
          </div>
        </div>
      </div>

      <div class="footer">
        Supply Type: <strong>${safeText(supplyTypeLabel)}</strong><br/>
        Invoice time: <strong>${safeText(formatInvoiceDateTime(paidAt))}</strong><br/>
        Invoice for GST purposes. Please keep this invoice for your records.
      </div>
    </div>
  </body>
</html>`;
}


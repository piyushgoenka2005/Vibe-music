"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Order } from "@/types/order";
import { formatPrice } from "@/features/invoice/utils/format";
import { formatInvoiceDate, invoiceStatusBadge, paymentMethodLabel, isInvoiceAvailable } from "@/features/invoice/utils/invoice-utils";
import { ROUTES } from "@/lib/routes";
import { BRAND } from "@/lib/brand";

function buildInvoiceShareUrl(invoiceUrl: string): string {
  // Ensure stable URL even if callers pass relative paths.
  if (invoiceUrl.startsWith("http")) return invoiceUrl;
  const base = BRAND.siteUrl.endsWith("/")
    ? BRAND.siteUrl.slice(0, -1)
    : BRAND.siteUrl;
  const path = invoiceUrl.startsWith("/") ? invoiceUrl : `/${invoiceUrl}`;
  return `${base}${path}`;
}

export function InvoiceToolbar({
  order,
  invoiceUrl,
  pdfUrl,
  htmlPrintUrl,
}: {
  order: Order;
  invoiceUrl: string;
  pdfUrl?: string;
  /** Opens printable HTML when server PDF is unavailable. */
  htmlPrintUrl?: string;
}) {
  const invoiceNumber = order.invoice?.invoiceNumber ?? "";
  const status = invoiceStatusBadge(order);

  const mailto = useMemo(() => {
    const to = order.email;
    const subject = `Vibe Music Invoice ${invoiceNumber}`;
    const body = [
      `Hi ${order.shippingAddress.name},`,
      ``,
      `Invoice: ${invoiceNumber}`,
      `Order ID: ${order.id}`,
      `Total: ${formatPrice(order.invoice?.grandTotal ?? order.total)}`,
      ``,
      `${buildInvoiceShareUrl(invoiceUrl)}`,
      ``,
      `— Vibe Music`,
    ].join("\n");

    return `mailto:${to}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }, [invoiceNumber, invoiceUrl, order.email, order.id, order.invoice?.grandTotal, order.shippingAddress.name, order.total]);

  const canShowInvoice = isInvoiceAvailable(order);

  if (!canShowInvoice) {
    return (
      <div className="invoice-toolbar invoice-toolbar--disabled">
        <p className="invoice-toolbar__muted">
          Invoice will be available after payment confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="invoice-toolbar no-print flex flex-col gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[#1253ED]">
          {invoiceNumber}
        </p>
        <p className="text-xs text-neutral-500">
          {order.invoice?.invoiceDate ? formatInvoiceDate(order.invoice.invoiceDate) : "-"} ·{" "}
          {status.label} · {formatPrice(order.invoice?.grandTotal ?? order.total)}
        </p>
        <p className="text-[11px] text-neutral-400 mt-1">
          {paymentMethodLabel(order.paymentMethod)}
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-11 w-full rounded border border-[#1253ED] bg-[#1253ED] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#0f3f99] sm:min-h-0 sm:w-auto sm:py-2"
        >
          Print
        </button>

        <a
          href={mailto}
          className="inline-flex min-h-11 w-full items-center justify-center rounded border border-neutral-300 px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 sm:min-h-0 sm:w-auto sm:py-2"
        >
          Email
        </a>

        <Link
          href={ROUTES.checkoutSuccess + `?orderId=${encodeURIComponent(order.id)}`}
          className="inline-flex min-h-11 w-full items-center justify-center rounded border border-neutral-300 px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 sm:min-h-0 sm:w-auto sm:py-2"
        >
          Order
        </Link>

        <Link
          href={invoiceUrl}
          className="inline-flex min-h-11 w-full items-center justify-center rounded border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 sm:min-h-0 sm:w-auto sm:py-2"
        >
          View invoice
        </Link>

        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center rounded border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 sm:min-h-0 sm:w-auto sm:py-2"
          >
            Download PDF
          </a>
        ) : htmlPrintUrl ? (
          <a
            href={htmlPrintUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center rounded border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 sm:min-h-0 sm:w-auto sm:py-2"
          >
            Save as PDF
          </a>
        ) : null}
      </div>
    </div>
  );
}


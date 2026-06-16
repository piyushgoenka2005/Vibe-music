import Link from "next/link";
import type { Order } from "@/types/order";
import { formatPrice } from "@/features/invoice/utils/format";
import { formatInvoiceDate, invoiceStatusBadge } from "@/features/invoice/utils/invoice-utils";

export function InvoicePreviewCard({
  order,
  invoiceUrl,
}: {
  order: Order;
  invoiceUrl: string;
}) {
  const invoiceNumber = order.invoice?.invoiceNumber ?? "";
  const status = invoiceStatusBadge(order);

  const itemCount = order.items?.length ?? 0;
  const invoiceDate = order.invoice?.invoiceDate
    ? formatInvoiceDate(order.invoice.invoiceDate)
    : "";

  if (!invoiceNumber) return null;

  return (
    <Link
      href={invoiceUrl}
      className="group mt-3 block border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-400 no-print"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">
            Tax invoice
          </p>
          <p className="mt-0.5 font-medium text-neutral-900">
            {invoiceNumber}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {invoiceDate} · {itemCount} item{itemCount !== 1 ? "s" : ""} ·{" "}
            {status.label}
          </p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-neutral-900">
          {formatPrice(order.invoice?.grandTotal ?? order.total)}
        </p>
      </div>
      <p className="mt-3 text-xs text-neutral-500 group-hover:text-neutral-800">
        View invoice →
      </p>
    </Link>
  );
}


import "server-only";

import type { Order } from "@/types/order";
import type { InvoiceSellerMeta } from "@/features/invoice/types";
import {
  generateInvoiceHtml as renderInvoiceHtml,
  mapVibeOrderToInvoiceOrder,
} from "@/invoice-generator";

export function generateInvoiceHtml(
  order: Order,
  seller: InvoiceSellerMeta
): string {
  const invoiceOrder = mapVibeOrderToInvoiceOrder(order, seller);
  return renderInvoiceHtml(invoiceOrder, {
    title: `Tax Invoice ${invoiceOrder.invoiceNumber}`,
    seller: invoiceOrder.seller,
  });
}

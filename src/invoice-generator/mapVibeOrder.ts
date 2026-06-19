import type { Order } from "@/types/order";
import type { InvoiceSellerMeta } from "@/features/invoice/types";
import type { InvoiceOrder } from "./invoice-types";
import type { InvoiceSeller } from "./invoice-utils";
import { INVOICE_SELLER } from "./invoice-utils";

export function mapSellerMeta(meta: InvoiceSellerMeta): InvoiceSeller {
  return {
    name: meta.storeName || INVOICE_SELLER.name,
    legalName: meta.legalName || meta.storeName || INVOICE_SELLER.legalName,
    tagline: meta.tagline ?? INVOICE_SELLER.tagline,
    address: meta.address || INVOICE_SELLER.address,
    email: meta.email || INVOICE_SELLER.email,
    phone: meta.phone || INVOICE_SELLER.phone,
    website: meta.website ?? INVOICE_SELLER.website,
    gstin: meta.gstin,
    pan: meta.pan,
    state: meta.state || INVOICE_SELLER.state,
    stateCode: meta.stateCode || INVOICE_SELLER.stateCode,
  };
}

export function mapVibeOrderToInvoiceOrder(
  order: Order,
  seller?: InvoiceSellerMeta
): InvoiceOrder {
  const invoice = order.invoice;
  if (!invoice) {
    throw new Error("Order invoice data missing");
  }

  const paymentMethod = order.razorpayPaymentId?.startsWith("demo_")
    ? "demo"
    : order.paymentMethod;

  const status =
    order.paymentStatus === "paid"
      ? "paid"
      : order.paymentStatus === "cod_pending"
        ? "confirmed"
        : "pending";

  return {
    id: order.id,
    invoiceNumber: invoice.invoiceNumber,
    createdAt: order.createdAt ?? invoice.invoiceDate,
    status,
    items: order.items.map((item) => ({
      handle: item.variantId ?? item.productId,
      title: item.name,
      hsnCode: undefined,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.price * item.quantity,
    })),
    shipping: {
      fullName: order.shippingAddress.name,
      addressLine1: order.shippingAddress.line1,
      addressLine2: order.shippingAddress.line2,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      pincode: order.shippingAddress.postalCode,
      country: order.shippingAddress.country,
      email: order.email,
      phone: order.customerPhone ?? order.shippingAddress.phone,
    },
    payment: {
      method: paymentMethod,
      paidAt: order.paymentCompletedAt,
      razorpayPaymentId: order.razorpayPaymentId,
    },
    totals: {
      subtotal: invoice.subtotal,
      discount: invoice.couponDiscount > 0 ? invoice.couponDiscount : undefined,
      discountCode: order.couponCode ?? undefined,
      shipping: invoice.shippingCharge,
      taxableAmount: invoice.taxableAmount,
      cgst: invoice.totalCgst,
      sgst: invoice.totalSgst,
      igst: invoice.totalIgst,
      grandTotal: invoice.grandTotal,
      cgstRate: invoice.cgstDisplayRate,
      sgstRate: invoice.sgstDisplayRate,
      igstRate: invoice.igstDisplayRate,
      isInterState: invoice.isInterState,
    },
    seller: seller ? mapSellerMeta(seller) : undefined,
  };
}

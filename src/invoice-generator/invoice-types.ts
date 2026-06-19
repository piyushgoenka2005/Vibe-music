export type InvoiceItem = {
  handle: string;
  title: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoiceOrder = {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  status?: string;
  items: InvoiceItem[];
  shipping: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode?: string;
    country?: string;
    email?: string;
    phone?: string;
    gstin?: string;
  };
  payment: { method: string; paidAt?: string; razorpayPaymentId?: string };
  totals: {
    subtotal: number;
    discount?: number;
    discountCode?: string;
    shipping: number;
    giftWrap?: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    grandTotal: number;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    isInterState?: boolean;
  };
  seller?: import("./invoice-utils").InvoiceSeller;
};

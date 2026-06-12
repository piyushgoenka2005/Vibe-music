/** Supported GST slab rates (percent). */
export type GSTRate = 5 | 12 | 18 | 28;

export const GST_RATES: readonly GSTRate[] = [5, 12, 18, 28] as const;

export const DEFAULT_GST_RATE: GSTRate = 18;

export const SELLER_STATE = "Maharashtra";

export interface GSTLineItem {
  productId: string;
  name: string;
  quantity: number;
  /** Unit price excluding GST (INR). */
  unitPrice: number;
  gstRate: GSTRate;
}

export interface GSTCalculationInput {
  items: GSTLineItem[];
  couponDiscount: number;
  shippingCharge: number;
  platformFee?: number;
  sellerState: string;
  buyerState: string;
}

export interface GSTLineBreakdown {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  gstRate: GSTRate;
  lineSubtotal: number;
  discountShare: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstAmount: number;
  lineTotal: number;
}

export interface GSTInvoiceData {
  subtotal: number;
  couponDiscount: number;
  shippingCharge: number;
  platformFee: number;
  taxableAmount: number;
  lineBreakdown: GSTLineBreakdown[];
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  grandTotal: number;
  isInterState: boolean;
  /** Display rate for CGST (half of item rate for intra-state). */
  cgstDisplayRate: number;
  /** Display rate for SGST (half of item rate for intra-state). */
  sgstDisplayRate: number;
  /** Weighted average IGST rate for inter-state display. */
  igstDisplayRate: number;
  sellerState: string;
  buyerState: string;
  invoiceNumber: string;
  invoiceDate: string;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function isInterStateOrder(sellerState: string, buyerState: string): boolean {
  return (
    sellerState.trim().toLowerCase() !== buyerState.trim().toLowerCase()
  );
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${datePart}-${randomPart}`;
}

/**
 * Calculates GST breakdown for a cart.
 * Discount is allocated proportionally across line items.
 * Shipping and platform fee attract GST at the weighted average rate.
 */
export function calculateGST(input: GSTCalculationInput): GSTInvoiceData {
  const {
    items,
    couponDiscount,
    shippingCharge,
    platformFee = 0,
    sellerState,
    buyerState,
  } = input;

  const interState = isInterStateOrder(sellerState, buyerState);
  const subtotal = round2(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );
  const cappedDiscount = Math.min(Math.max(couponDiscount, 0), subtotal);

  const lineBreakdown: GSTLineBreakdown[] = items.map((item) => {
    const lineSubtotal = round2(item.unitPrice * item.quantity);
    const discountShare =
      subtotal > 0
        ? round2((lineSubtotal / subtotal) * cappedDiscount)
        : 0;
    const taxableAmount = round2(lineSubtotal - discountShare);
    const gstAmount = round2(taxableAmount * (item.gstRate / 100));

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (interState) {
      igst = gstAmount;
    } else {
      cgst = round2(gstAmount / 2);
      sgst = round2(gstAmount - cgst);
    }

    return {
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      gstRate: item.gstRate,
      lineSubtotal,
      discountShare,
      taxableAmount,
      cgst,
      sgst,
      igst,
      gstAmount,
      lineTotal: round2(taxableAmount + gstAmount),
    };
  });

  const itemsTaxable = round2(
    lineBreakdown.reduce((sum, line) => sum + line.taxableAmount, 0)
  );

  const weightedGstRate =
    itemsTaxable > 0
      ? round2(
          lineBreakdown.reduce(
            (sum, line) => sum + line.taxableAmount * line.gstRate,
            0
          ) / itemsTaxable
        )
      : DEFAULT_GST_RATE;

  const shippingTaxable = round2(shippingCharge);
  const platformTaxable = round2(platformFee);
  const extraTaxable = round2(shippingTaxable + platformTaxable);
  const extraGst = round2(extraTaxable * (weightedGstRate / 100));

  let extraCgst = 0;
  let extraSgst = 0;
  let extraIgst = 0;

  if (interState) {
    extraIgst = extraGst;
  } else {
    extraCgst = round2(extraGst / 2);
    extraSgst = round2(extraGst - extraCgst);
  }

  const totalCgst = round2(
    lineBreakdown.reduce((sum, line) => sum + line.cgst, 0) + extraCgst
  );
  const totalSgst = round2(
    lineBreakdown.reduce((sum, line) => sum + line.sgst, 0) + extraSgst
  );
  const totalIgst = round2(
    lineBreakdown.reduce((sum, line) => sum + line.igst, 0) + extraIgst
  );
  const totalGst = round2(totalCgst + totalSgst + totalIgst);

  const taxableAmount = round2(itemsTaxable + extraTaxable);
  const grandTotal = round2(taxableAmount + totalGst);

  const cgstDisplayRate = interState
    ? 0
    : round2(weightedGstRate / 2);
  const sgstDisplayRate = interState
    ? 0
    : round2(weightedGstRate / 2);
  const igstDisplayRate = interState ? weightedGstRate : 0;

  return {
    subtotal,
    couponDiscount: cappedDiscount,
    shippingCharge: round2(shippingCharge),
    platformFee: round2(platformFee),
    taxableAmount,
    lineBreakdown,
    totalCgst,
    totalSgst,
    totalIgst,
    totalGst,
    grandTotal,
    isInterState: interState,
    cgstDisplayRate,
    sgstDisplayRate,
    igstDisplayRate,
    sellerState,
    buyerState,
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: new Date().toISOString(),
  };
}

/** Convert INR to paise for Razorpay. */
export function toPaise(amountInr: number): number {
  return Math.round(amountInr * 100);
}

export const FREE_SHIPPING_THRESHOLD = 9999;
export const STANDARD_SHIPPING_CHARGE = 100;

export function getShippingCharge(
  subtotal: number,
  discount: number
): number {
  const afterDiscount = subtotal - discount;
  return afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_CHARGE;
}

/** Default GST rate by product category slug. */
export function getDefaultGstRateForCategory(categorySlug: string): GSTRate {
  const slug = categorySlug.toLowerCase();
  if (slug.includes("software") || slug.includes("plug-in")) return 18;
  if (slug.includes("accessories") || slug.includes("cables")) return 18;
  if (slug.includes("book") || slug.includes("sheet")) return 5;
  return DEFAULT_GST_RATE;
}

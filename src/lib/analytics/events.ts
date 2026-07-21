import { isAnalyticsEnabled } from "@/lib/analytics/config";
import {
  cartLineToGa4Item,
  cartLinesToGa4Items,
  orderToGa4Items,
  productToGa4Item,
  sumLineValue,
  type CartAnalyticsLine,
} from "@/lib/analytics/items";
import { trackGaEcommerce, trackGaEvent } from "@/lib/analytics/gtag";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";

const PURCHASE_DEDUPE_PREFIX = "vibe-ga-purchase-";

function canTrack(): boolean {
  return typeof window !== "undefined" && isAnalyticsEnabled();
}

export function trackViewItem(
  product: Product,
  options?: { variantLabel?: string; value?: number }
): void {
  if (!canTrack()) return;
  const item = productToGa4Item(product, {
    quantity: 1,
    variantLabel: options?.variantLabel,
  });
  trackGaEcommerce("view_item", {
    currency: "INR",
    value: options?.value ?? product.price,
    items: [item],
  });
}

export function trackAddToCart(
  product: Product,
  quantity: number,
  variantLabel?: string
): void {
  if (!canTrack()) return;
  const item = productToGa4Item(product, { quantity, variantLabel });
  trackGaEcommerce("add_to_cart", {
    currency: "INR",
    value: product.price * quantity,
    items: [item],
  });
}

export function trackRemoveFromCart(line: CartAnalyticsLine): void {
  if (!canTrack()) return;
  trackGaEcommerce("remove_from_cart", {
    currency: "INR",
    value: line.price * line.quantity,
    items: [cartLineToGa4Item(line)],
  });
}

export function trackViewCart(lines: CartAnalyticsLine[]): void {
  if (!canTrack() || lines.length === 0) return;
  trackGaEcommerce("view_cart", {
    currency: "INR",
    value: sumLineValue(lines),
    items: cartLinesToGa4Items(lines),
  });
}

export function trackBeginCheckout(lines: CartAnalyticsLine[], coupon?: string): void {
  if (!canTrack() || lines.length === 0) return;
  trackGaEcommerce("begin_checkout", {
    currency: "INR",
    value: sumLineValue(lines),
    coupon,
    items: cartLinesToGa4Items(lines),
  });
}

export function trackAddShippingInfo(lines: CartAnalyticsLine[]): void {
  if (!canTrack() || lines.length === 0) return;
  trackGaEcommerce("add_shipping_info", {
    currency: "INR",
    value: sumLineValue(lines),
    shipping_tier: "standard",
    items: cartLinesToGa4Items(lines),
  });
}

export function trackAddPaymentInfo(
  lines: CartAnalyticsLine[],
  paymentType = "razorpay"
): void {
  if (!canTrack() || lines.length === 0) return;
  trackGaEcommerce("add_payment_info", {
    currency: "INR",
    value: sumLineValue(lines),
    payment_type: paymentType,
    items: cartLinesToGa4Items(lines),
  });
}

export function trackPurchase(order: Order): void {
  if (!canTrack()) return;
  const dedupeKey = `${PURCHASE_DEDUPE_PREFIX}${order.id}`;
  try {
    if (sessionStorage.getItem(dedupeKey) === "1") return;
    sessionStorage.setItem(dedupeKey, "1");
  } catch {
    /* ignore */
  }

  trackGaEcommerce("purchase", {
    currency: "INR",
    transaction_id: order.id,
    value: order.total,
    coupon: order.couponCode ?? undefined,
    shipping: order.shippingCharge,
    tax: order.totalGst,
    items: orderToGa4Items(order),
  });
}

export function trackSearch(searchTerm: string): void {
  if (!canTrack() || !searchTerm.trim()) return;
  trackGaEvent("search", { search_term: searchTerm.trim() });
}

export function trackGenerateLead(source: string): void {
  if (!canTrack()) return;
  trackGaEvent("generate_lead", { lead_source: source });
}

export function trackLogin(method = "email"): void {
  if (!canTrack()) return;
  trackGaEvent("login", { method });
}

export function trackSignUp(method = "email"): void {
  if (!canTrack()) return;
  trackGaEvent("sign_up", { method });
}

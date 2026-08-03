import type { Order } from "@/types/order";
import type { CheckoutMode } from "@/store/buyNowStore";

const prefix = "checkout-order-";

interface CachedOrderPayload {
  order: Order;
  checkoutMode?: CheckoutMode;
}

function parseCachedPayload(raw: string): CachedOrderPayload | null {
  try {
    const parsed = JSON.parse(raw) as CachedOrderPayload | Order;
    if (parsed && typeof parsed === "object" && "order" in parsed) {
      return parsed as CachedOrderPayload;
    }
    // Legacy: bare Order JSON
    return { order: parsed as Order, checkoutMode: "cart" };
  } catch {
    return null;
  }
}

export function cacheOrderForConfirmation(
  order: Order,
  options?: { checkoutMode?: CheckoutMode }
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedOrderPayload = {
      order,
      checkoutMode: options?.checkoutMode ?? "cart",
    };
    sessionStorage.setItem(`${prefix}${order.id}`, JSON.stringify(payload));
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function readCachedOrderForConfirmation(orderId: string): Order | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${prefix}${orderId}`);
    if (!raw) return null;
    return parseCachedPayload(raw)?.order ?? null;
  } catch {
    return null;
  }
}

export function readCachedCheckoutMode(orderId: string): CheckoutMode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${prefix}${orderId}`);
    if (!raw) return null;
    const mode = parseCachedPayload(raw)?.checkoutMode;
    return mode === "buyNow" ? "buyNow" : mode === "cart" ? "cart" : null;
  } catch {
    return null;
  }
}

export function clearCachedOrderForConfirmation(orderId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${prefix}${orderId}`);
}

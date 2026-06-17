import type { Order } from "@/types/order";

const prefix = "checkout-order-";

export function cacheOrderForConfirmation(order: Order): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${prefix}${order.id}`, JSON.stringify(order));
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function readCachedOrderForConfirmation(orderId: string): Order | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${prefix}${orderId}`);
    if (!raw) return null;
    return JSON.parse(raw) as Order;
  } catch {
    return null;
  }
}

export function clearCachedOrderForConfirmation(orderId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${prefix}${orderId}`);
}

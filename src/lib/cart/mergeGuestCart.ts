import type { CartItem } from "@/store/cartStore";
import { useCartStore } from "@/store/cartStore";

export function mergeCartItems(
  existing: CartItem[],
  incoming: CartItem[]
): CartItem[] {
  const merged = [...existing];

  for (const item of incoming) {
    const index = merged.findIndex((i) => i.lineId === item.lineId);
    if (index >= 0) {
      merged[index] = {
        ...merged[index]!,
        quantity: Math.min(99, merged[index]!.quantity + item.quantity),
      };
    } else {
      merged.push(item);
    }
  }

  return merged;
}

const GUEST_CART_SNAPSHOT_KEY = "vibe-cart-guest-snapshot";

export function snapshotGuestCart(items: CartItem[]): void {
  if (typeof window === "undefined" || items.length === 0) return;
  try {
    sessionStorage.setItem(GUEST_CART_SNAPSHOT_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export function consumeGuestCartSnapshot(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(GUEST_CART_SNAPSHOT_KEY);
    sessionStorage.removeItem(GUEST_CART_SNAPSHOT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export function mergeGuestCartOnAuth(): void {
  const snapshot = consumeGuestCartSnapshot();
  if (snapshot.length === 0) return;

  const current = useCartStore.getState().items;

  if (current.length === 0) {
    useCartStore.setState({ items: snapshot });
    return;
  }

  useCartStore.setState({ items: mergeCartItems(current, snapshot) });
}

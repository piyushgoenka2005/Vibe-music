import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/types/product";

vi.mock("@/store/toastStore", () => ({
  useToastStore: {
    getState: () => ({
      show: vi.fn(),
    }),
  },
}));

function installMemorySessionStorage() {
  const map = new Map<string, string>();
  const storage = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  };
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: storage,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage: storage, localStorage: storage },
  });
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    slug: "test-guitar",
    name: "Test Guitar",
    brand: "Hertz",
    brandSlug: "hertz",
    category: "Guitars",
    categorySlug: "guitars",
    price: 10000,
    originalPrice: 12000,
    rating: 4,
    reviewCount: 2,
    availability: "in-stock",
    condition: "new",
    imageColor: "#eee",
    image: "/guitar.webp",
    ...overrides,
  } as Product;
}

describe("buyNowStore", () => {
  beforeEach(async () => {
    vi.resetModules();
    installMemorySessionStorage();
    sessionStorage.clear();
    const { useBuyNowStore } = await import("@/store/buyNowStore");
    useBuyNowStore.setState({ item: null });
    const { useCartStore } = await import("@/store/cartStore");
    useCartStore.setState({
      items: [],
      couponCode: null,
      appliedCoupon: null,
    });
  });

  it("startBuyNow sets a single session item without touching the cart", async () => {
    const { useBuyNowStore } = await import("@/store/buyNowStore");
    const { useCartStore } = await import("@/store/cartStore");

    useCartStore
      .getState()
      .addItem(
        makeProduct({ id: "already-in-cart", slug: "cart-item", name: "Cart Item" })
      );
    expect(useCartStore.getState().items).toHaveLength(1);

    const ok = useBuyNowStore
      .getState()
      .startBuyNow(
        makeProduct({ id: "buy-now", slug: "buy-now", name: "Buy Now Item" }),
        2
      );

    expect(ok).toBe(true);
    expect(useBuyNowStore.getState().getItems()).toHaveLength(1);
    expect(useBuyNowStore.getState().item?.productId).toBe("buy-now");
    expect(useBuyNowStore.getState().item?.quantity).toBe(2);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]?.productId).toBe("already-in-cart");
  });

  it("clearBuyNow empties the session and leaves the cart intact", async () => {
    const { useBuyNowStore } = await import("@/store/buyNowStore");
    const { useCartStore } = await import("@/store/cartStore");

    useCartStore.getState().addItem(makeProduct({ id: "cart-a", slug: "cart-a" }));
    useBuyNowStore.getState().startBuyNow(makeProduct({ id: "bn", slug: "bn" }));
    useBuyNowStore.getState().clearBuyNow();

    expect(useBuyNowStore.getState().item).toBeNull();
    expect(useBuyNowStore.getState().getItems()).toEqual([]);
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("rejects coming-soon products", async () => {
    const { useBuyNowStore } = await import("@/store/buyNowStore");
    const ok = useBuyNowStore
      .getState()
      .startBuyNow(makeProduct({ price: 0, originalPrice: undefined }));
    expect(ok).toBe(false);
    expect(useBuyNowStore.getState().item).toBeNull();
  });

  it("isBuyNowCheckoutSearchParam accepts truthy flags", async () => {
    const { isBuyNowCheckoutSearchParam } = await import("@/store/buyNowStore");
    expect(isBuyNowCheckoutSearchParam("1")).toBe(true);
    expect(isBuyNowCheckoutSearchParam("true")).toBe(true);
    expect(isBuyNowCheckoutSearchParam("0")).toBe(false);
    expect(isBuyNowCheckoutSearchParam(null)).toBe(false);
  });
});

describe("orderConfirmationCache checkoutMode", () => {
  beforeEach(() => {
    installMemorySessionStorage();
    sessionStorage.clear();
  });

  it("stores and reads checkoutMode with the order", async () => {
    const {
      cacheOrderForConfirmation,
      readCachedCheckoutMode,
      readCachedOrderForConfirmation,
    } = await import("@/lib/checkout/orderConfirmationCache");

    const order = {
      id: "ord_1",
      items: [],
      total: 100,
    } as never;

    cacheOrderForConfirmation(order, { checkoutMode: "buyNow" });
    expect(readCachedCheckoutMode("ord_1")).toBe("buyNow");
    expect(readCachedOrderForConfirmation("ord_1")?.id).toBe("ord_1");
  });

  it("treats legacy bare Order JSON as cart mode", async () => {
    const {
      readCachedCheckoutMode,
      readCachedOrderForConfirmation,
    } = await import("@/lib/checkout/orderConfirmationCache");

    sessionStorage.setItem(
      "checkout-order-legacy",
      JSON.stringify({ id: "legacy", items: [], total: 1 })
    );

    expect(readCachedOrderForConfirmation("legacy")?.id).toBe("legacy");
    expect(readCachedCheckoutMode("legacy")).toBe("cart");
  });
});

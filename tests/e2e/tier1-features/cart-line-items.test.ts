import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCartStore } from "@/store/cartStore";
import { sampleProducts, sampleVariants } from "../fixtures/catalog-fixtures";
import { buildCartMilestoneState } from "@/lib/cart/cartMilestones";

vi.mock("@/store/toastStore", () => ({
  useToastStore: {
    getState: () => ({
      show: vi.fn(),
    }),
  },
}));

vi.mock("@/lib/analytics/events", () => ({
  trackAddToCart: vi.fn(),
  trackRemoveFromCart: vi.fn(),
}));

describe("Tier 1: Cart Line Items & Storage Operations", () => {
  beforeEach(() => {
    useCartStore.setState({ isUpdating: false });
    useCartStore.getState().clearCart();
  });

  it("adds standard product to cart and updates itemCount and subtotal", () => {
    const product = sampleProducts[0]; // Fender Strat ₹68,500
    useCartStore.getState().addItem(product, 1);

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.itemCount()).toBe(1);
    expect(state.subtotal()).toBe(68500);
    expect(state.total()).toBe(68500);

    const item = state.items[0];
    expect(item.productId).toBe(product.id);
    expect(item.name).toBe(product.name);
    expect(item.price).toBe(68500);
    expect(item.quantity).toBe(1);
  });

  it("adds product with specific variant to cart and reflects variant pricing", () => {
    const product = sampleProducts[0];
    const blackVariant = sampleVariants.strat[1]; // ₹71,000

    useCartStore.getState().addItem(product, 1, blackVariant);

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    const item = state.items[0];
    expect(item.variantId).toBe(blackVariant.id);
    expect(item.variantSku).toBe(blackVariant.sku);
    expect(item.price).toBe(71000);
    expect(state.subtotal()).toBe(71000);
  });

  it("updates line item quantity correctly", () => {
    const product = sampleProducts[1]; // Yamaha P-125 ₹52,990
    useCartStore.getState().addItem(product, 1);

    const lineId = useCartStore.getState().items[0].lineId;
    useCartStore.getState().updateQuantity(lineId, 3);

    const state = useCartStore.getState();
    expect(state.itemCount()).toBe(3);
    expect(state.items[0].quantity).toBe(3);
    expect(state.subtotal()).toBe(52990 * 3);
  });

  it("removes line item when quantity is reduced to 0 or removeItem is called", () => {
    useCartStore.getState().addItem(sampleProducts[0], 2);

    const lineId = useCartStore.getState().items[0].lineId;

    // Reset update throttle and reduce to 0
    useCartStore.setState({ isUpdating: false });
    useCartStore.getState().updateQuantity(lineId, 0);
    expect(useCartStore.getState().items.length).toBe(0);

    // Re-add and remove via removeItem
    useCartStore.getState().addItem(sampleProducts[0], 1);
    expect(useCartStore.getState().items.length).toBe(1);

    const newLineId = useCartStore.getState().items[0].lineId;
    useCartStore.getState().removeItem(newLineId);
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it("calculates free shipping milestones based on cart subtotal", () => {
    // Single threshold: free shipping only
    const configShippingOnly = {
      freeShippingThreshold: 5000,
      freeGiftThreshold: 0,
      giftProductId: null,
      giftProduct: null,
    };

    const stateBelow = buildCartMilestoneState(3000, configShippingOnly);
    expect(stateBelow.milestones[0].unlocked).toBe(false);
    expect(stateBelow.progressRatio).toBeCloseTo(3000 / 5000, 2);

    const stateAbove = buildCartMilestoneState(6000, configShippingOnly);
    expect(stateAbove.milestones[0].unlocked).toBe(true);
    expect(stateAbove.progressRatio).toBe(1.0);

    // Multi-threshold: shipping + free gift
    const configWithGift = {
      freeShippingThreshold: 5000,
      freeGiftThreshold: 10000,
      giftProductId: "prod-free-picks",
      giftProduct: null,
    };
    const stateWithGift = buildCartMilestoneState(3000, configWithGift);
    expect(stateWithGift.milestones[0].unlocked).toBe(false);
    expect(stateWithGift.milestones[1].unlocked).toBe(false);
    expect(stateWithGift.progressRatio).toBeCloseTo(3000 / 10000, 2);
  });

  it("clears entire cart on clearCart action", () => {
    useCartStore.getState().addItem(sampleProducts[0], 1);
    useCartStore.getState().addItem(sampleProducts[1], 1);
    expect(useCartStore.getState().items.length).toBe(2);

    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items.length).toBe(0);
    expect(useCartStore.getState().subtotal()).toBe(0);
  });
});

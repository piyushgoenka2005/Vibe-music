import { describe, expect, it } from "vitest";
import {
  buildCartMilestoneState,
  milestoneMarkerPosition,
} from "@/lib/cart/cartMilestones";
import type { CartPromotionsPublic } from "@/lib/cart/cartPromotions";

const configWithGift: CartPromotionsPublic = {
  freeShippingThreshold: 400,
  freeGiftThreshold: 799,
  giftProductId: "gift-1",
  bannerText: "Free gift on orders above ₹799",
  giftProduct: null,
};

const configShippingOnly: CartPromotionsPublic = {
  freeShippingThreshold: 400,
  freeGiftThreshold: 799,
  giftProductId: null,
  bannerText: "Free shipping on orders above ₹400",
  giftProduct: null,
};

describe("cartMilestones", () => {
  it("builds shipping-only milestones when no gift is configured", () => {
    const state = buildCartMilestoneState(250, configShippingOnly);
    expect(state.milestones).toHaveLength(1);
    expect(state.milestones[0]?.id).toBe("free-shipping");
    expect(state.nextMilestone?.id).toBe("free-shipping");
    expect(state.targetThreshold).toBe(400);
  });

  it("omits shipping milestone when threshold is zero (always free)", () => {
    const state = buildCartMilestoneState(0, {
      freeShippingThreshold: 0,
      freeGiftThreshold: 799,
      giftProductId: null,
      bannerText: "Free standard shipping on every order",
      giftProduct: null,
    });
    expect(state.milestones).toHaveLength(0);
    expect(state.statusMessage).toMatch(/free standard shipping/i);
  });

  it("marks milestones unlocked at thresholds", () => {
    const state = buildCartMilestoneState(850, configWithGift);
    expect(state.milestones.every((milestone) => milestone.unlocked)).toBe(true);
    expect(state.nextMilestone).toBeNull();
    expect(state.progressRatio).toBe(1);
  });

  it("positions markers relative to target threshold", () => {
    expect(milestoneMarkerPosition(400, 799)).toBeCloseTo(50.06, 1);
    expect(milestoneMarkerPosition(799, 799)).toBe(100);
  });
});

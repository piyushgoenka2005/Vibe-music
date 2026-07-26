import { describe, expect, it } from "vitest";
import type { CartGiftProductSummary } from "@/lib/cart/cartPromotions";
import {
  buildPromoGiftLine,
  computeItemSavings,
  computeMrpTotal,
  computePaidSubtotal,
  getPromoGiftLineId,
  isFreeGiftUnlocked,
  isFreeShippingUnlocked,
  syncPromoGiftItems,
} from "@/lib/cart/promoGift";
import type { CartItem } from "@/store/cartStore";

const gift: CartGiftProductSummary = {
  id: "gift-1",
  slug: "free-gift",
  name: "Free Gift Item",
  brand: "Vibe",
  originalPrice: 149,
  price: 149,
  imageColor: "#fff",
};

function paidItem(price: number, qty = 1, originalPrice?: number): CartItem {
  return {
    lineId: `line-${price}`,
    productId: `prod-${price}`,
    name: "Product",
    brand: "Brand",
    price,
    originalPrice,
    gstRate: 18,
    quantity: qty,
  };
}

describe("promoGift", () => {
  it("computes paid subtotal excluding promo gifts", () => {
    const items = [
      buildPromoGiftLine(gift),
      paidItem(500),
    ];
    expect(computePaidSubtotal(items)).toBe(500);
  });

  it("computes item savings from original prices excluding gifts", () => {
    const items = [paidItem(800, 1, 1000), buildPromoGiftLine(gift)];
    expect(computeItemSavings(items)).toBe(200);
  });

  it("computes MRP total excluding promo gifts", () => {
    const items = [paidItem(800, 1, 1000), buildPromoGiftLine(gift)];
    expect(computeMrpTotal(items)).toBe(1000);
  });

  it("adds gift when threshold met", () => {
    const synced = syncPromoGiftItems([paidItem(850)], gift, 799);
    expect(synced).toHaveLength(2);
    expect(synced[0].isPromoGift).toBe(true);
    expect(synced[0].price).toBe(0);
  });

  it("removes gift when threshold not met", () => {
    const synced = syncPromoGiftItems(
      [buildPromoGiftLine(gift), paidItem(500)],
      gift,
      799
    );
    expect(synced).toHaveLength(1);
    expect(synced[0].isPromoGift).toBeUndefined();
  });

  it("uses stable promo gift line id", () => {
    expect(getPromoGiftLineId("gift-1")).toBe("promo-gift:gift-1");
  });

  it("tracks shipping and gift unlock states", () => {
    expect(isFreeShippingUnlocked(450, 400)).toBe(true);
    expect(isFreeGiftUnlocked(850, 799, true)).toBe(true);
    expect(isFreeGiftUnlocked(850, 799, false)).toBe(false);
  });
});

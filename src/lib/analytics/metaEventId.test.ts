import { describe, expect, it } from "vitest";
import {
  createMetaEventId,
  metaAddToCartEventId,
  metaCheckoutEventId,
  metaPageViewEventId,
  metaPurchaseEventId,
  metaViewContentEventId,
} from "@/lib/analytics/metaEventId";

describe("metaEventId", () => {
  it("uses order.id as canonical Purchase event_id", () => {
    expect(metaPurchaseEventId("order-abc-123")).toBe("order-abc-123");
  });

  it("builds stable ViewContent ids from product id", () => {
    expect(metaViewContentEventId("prod-99")).toBe("viewcontent-prod-99");
  });

  it("builds checkout id from sorted cart lines", () => {
    const a = metaCheckoutEventId([
      { productId: "b", name: "B", price: 100, quantity: 2 },
      { productId: "a", name: "A", price: 50, quantity: 1 },
    ]);
    const b = metaCheckoutEventId([
      { productId: "a", name: "A", price: 50, quantity: 1 },
      { productId: "b", name: "B", price: 100, quantity: 2 },
    ]);
    expect(a).toBe(b);
    expect(a).toMatch(/^checkout-/);
  });

  it("includes quantity and second bucket in AddToCart ids", () => {
    const id = metaAddToCartEventId("prod-1", 3);
    expect(id).toMatch(/^addtocart-prod-1-3-\d+$/);
  });

  it("scopes PageView ids per path and minute", () => {
    const id = metaPageViewEventId("/brands/gibraltar");
    expect(id).toMatch(/^pageview-\/brands\/gibraltar-\d+$/);
  });

  it("normalizes whitespace in custom ids", () => {
    expect(createMetaEventId("test", "hello world")).toBe("test-hello-world");
  });
});

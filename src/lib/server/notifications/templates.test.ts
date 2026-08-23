import { describe, expect, it } from "vitest";
import { renderLifecycleMessage } from "@/lib/server/notifications/templates";
import type { LifecycleEvent } from "@/lib/server/notifications/types";

const recipient = { customerName: "Ravi <guitarist>" };
const ctx = {
  orderId: "ord_abcdef1234567890",
  total: 24999,
  trackingNumber: "TRK123456",
  courier: "BlueDart",
  itemLines: ["1 × Hertz HZA3900EQ Guitar"],
};

const ALL_EVENTS: LifecycleEvent[] = [
  "order_confirmed",
  "payment_failed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "order_cancelled",
  "refund_initiated",
  "rental_booked",
  "rental_reminder",
];

describe("lifecycle templates", () => {
  it("renders every lifecycle event without throwing", () => {
    for (const event of ALL_EVENTS) {
      const msg = renderLifecycleMessage(event, recipient, ctx);
      expect(msg.subject.length).toBeGreaterThan(5);
      expect(msg.html).toContain("<html");
      expect(msg.text).toContain(orderRef());
      expect(msg.smsText.length).toBeGreaterThan(10);
      expect(msg.pushTitle.length).toBeGreaterThan(3);
      expect(msg.url).toContain("/track-order");
    }
  });

  it("escapes HTML in user-controlled name fields", () => {
    const msg = renderLifecycleMessage("order_confirmed", recipient, ctx);
    expect(msg.html).not.toContain("Ravi <guitarist>");
    expect(msg.html).toContain("Ravi &lt;guitarist&gt;");
  });

  it("includes shipping details on shipped event", () => {
    const msg = renderLifecycleMessage("shipped", recipient, ctx);
    expect(msg.text).toContain("TRK123456");
    expect(msg.text).toContain("BlueDart");
    expect(msg.pushTitle).toBe("Order shipped");
  });

  it("formats totals as INR currency", () => {
    const msg = renderLifecycleMessage("order_confirmed", recipient, ctx);
    expect(msg.html).toMatch(/₹|Rs\.? ?24,?999|INR/i);
  });

  function orderRef(): string {
    return "#12345678".toUpperCase().replace("12345678", ctx.orderId.slice(-8).toUpperCase());
  }
});

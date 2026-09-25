import { describe, expect, it } from "vitest";
import {
  AUTH_TRUST_BULLETS,
  CHECKOUT_TRUST_BULLETS,
  CHECKOUT_TRUST_SUMMARY,
  PAYMENT_TRUST_BADGES,
  WHY_SHOP_SECURE_PAYMENTS_SUBTITLE,
} from "@/data/trustSignals";

describe("trustSignals", () => {
  it("exposes non-empty audit-backed checkout and auth bullets", () => {
    expect(CHECKOUT_TRUST_BULLETS.length).toBeGreaterThanOrEqual(3);
    expect(AUTH_TRUST_BULLETS.every((line) => line.length > 8)).toBe(true);
    expect(CHECKOUT_TRUST_SUMMARY).toMatch(/server-verified/i);
    expect(PAYMENT_TRUST_BADGES).toHaveLength(2);
    expect(WHY_SHOP_SECURE_PAYMENTS_SUBTITLE).toMatch(/Razorpay/i);
  });
});

import { describe, expect, it } from "vitest";
import { linkGuestOrdersToUser, normalizeGstRate } from "@/lib/server/orderService";

describe("orderService security", () => {
  it("linkGuestOrdersToUser is disabled to prevent IDOR bulk linking", async () => {
    const linked = await linkGuestOrdersToUser("user_1", "victim@example.com");
    expect(linked).toBe(0);
  });

  it("normalizeGstRate falls back to default for invalid rates", () => {
    expect(normalizeGstRate(undefined)).toBe(18);
    expect(normalizeGstRate(12)).toBe(12);
    expect(normalizeGstRate(99)).toBe(18);
  });
});

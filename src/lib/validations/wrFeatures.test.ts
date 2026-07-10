import { describe, expect, it } from "vitest";
import {
  adminInviteSchema,
  createSupportTicketSchema,
  shippingZoneSchema,
} from "@/lib/validations/wrFeatures";

describe("wrFeatures validations", () => {
  it("validates support ticket input", () => {
    const parsed = createSupportTicketSchema.parse({
      name: "Jane Doe",
      email: "jane@example.com",
      subject: "Order issue",
      message: "My order has not arrived yet, please help.",
      category: "order",
    });
    expect(parsed.category).toBe("order");
  });

  it("rejects weak admin passwords", () => {
    expect(() =>
      adminInviteSchema.parse({
        email: "admin@vibemusic.in",
        displayName: "Admin",
        role: "admin",
        password: "short",
      })
    ).toThrow();
  });

  it("accepts shipping zone config", () => {
    const zone = shippingZoneSchema.parse({
      name: "Metro",
      states: ["Maharashtra"],
      pinCodePrefixes: ["40"],
      methodCharges: { standard: 99 },
    });
    expect(zone.name).toBe("Metro");
  });
});

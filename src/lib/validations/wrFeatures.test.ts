import { describe, expect, it } from "vitest";
import {
  adminInviteSchema,
  createSupportTicketSchema,
  shippingZoneSchema,
} from "@/lib/validations/wrFeatures";

describe("wrFeatures validations", () => {
  it("validates support ticket input for various categories", () => {
    const categories = ["order", "shipping", "returns", "product", "payment", "other"] as const;
    for (const category of categories) {
      const parsed = createSupportTicketSchema.parse({
        name: "Jane Doe",
        email: "jane@example.com",
        subject: `Inquiry regarding ${category}`,
        message: "Detailed message for the support team.",
        category,
        orderId: category === "order" ? "ORD-12345" : undefined,
      });
      expect(parsed.category).toBe(category);
    }
  });

  it("rejects invalid support ticket input", () => {
    expect(() =>
      createSupportTicketSchema.parse({
        name: "J",
        email: "not-an-email",
        subject: "Hi",
        message: "Short",
      }),
    ).toThrow();
  });

  it("rejects weak admin passwords when provided", () => {
    expect(() =>
      adminInviteSchema.parse({
        email: "admin@vibemusic.in",
        displayName: "Admin",
        role: "admin",
        password: "short",
      }),
    ).toThrow();
  });

  it("allows inviting without password for promote-existing flow", () => {
    const parsed = adminInviteSchema.parse({
      email: "admin@vibemusic.in",
      displayName: "Admin",
      role: "admin",
    });
    expect(parsed.password).toBeUndefined();
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

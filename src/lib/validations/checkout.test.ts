import { z } from "zod";
import { describe, expect, it } from "vitest";
import {
  createOrderSchema,
  demoPaymentSchema,
  verifyPaymentSchema,
} from "@/lib/validations/checkout";

describe("checkout validations", () => {
  it("accepts a valid create-order payload", () => {
    const parsed = createOrderSchema.safeParse({
      items: [
        {
          productId: "p1",
          name: "Guitar",
          quantity: 1,
          price: 10000,
          gstRate: 18,
        },
      ],
      email: "buyer@example.com",
      shippingAddress: {
        name: "Buyer",
        line1: "1 Test St",
        city: "Kolkata",
        state: "WB",
        postalCode: "700001",
        country: "IN",
      },
      paymentMethod: "razorpay",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects non-razorpay payment methods", () => {
    const parsed = createOrderSchema.safeParse({
      items: [
        {
          productId: "p1",
          name: "Guitar",
          quantity: 1,
          price: 10000,
          gstRate: 18,
        },
      ],
      email: "buyer@example.com",
      shippingAddress: {
        name: "Buyer",
        line1: "1 Test St",
        city: "Kolkata",
        state: "WB",
        postalCode: "700001",
        country: "IN",
      },
      paymentMethod: "cod",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires verify-payment signature fields", () => {
    expect(
      verifyPaymentSchema.safeParse({
        orderId: "o1",
        razorpayOrderId: "ro1",
        razorpayPaymentId: "rp1",
        razorpaySignature: "sig",
      }).success
    ).toBe(true);
    expect(verifyPaymentSchema.safeParse({ orderId: "o1" }).success).toBe(false);
  });

  it("requires email or tracking token for demo payment", () => {
    expect(
      demoPaymentSchema.safeParse({ orderId: "o1", email: "a@b.com" }).success
    ).toBe(true);
    expect(demoPaymentSchema.safeParse({ orderId: "o1" }).success).toBe(false);
  });

  it("surfaces zod issue messages", () => {
    const parsed = createOrderSchema.safeParse({ items: [] });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error).toBeInstanceOf(z.ZodError);
    }
  });
});

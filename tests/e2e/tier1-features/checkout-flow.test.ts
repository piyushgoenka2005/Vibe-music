import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  checkoutShippingAddressSchema,
  createOrderSchema,
  verifyPaymentSchema,
} from "@/lib/validations/checkout";
import { calculateGST } from "@/lib/gstCalculator";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay/signature";
import { calculateCouponDiscountAmount } from "@/lib/coupons/couponMath";
import { sampleProducts, sampleCoupons } from "../fixtures/catalog-fixtures";

describe("Tier 1: Checkout Flow & Order Placement Pipeline", () => {
  it("validates valid and invalid customer shipping addresses", () => {
    const validAddress = {
      name: "Rohan Varma",
      line1: "123 Indiranagar 100ft Road",
      line2: "Apt 4B",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560038",
      country: "India",
      phone: "+91 9876543210",
    };

    const validResult = checkoutShippingAddressSchema.safeParse(validAddress);
    expect(validResult.success).toBe(true);

    // Invalid missing required fields (name, line1, postalCode)
    const invalidAddress = {
      name: "",
      line1: "",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "12", // too short (min 4)
      country: "India",
    };

    const invalidResult = checkoutShippingAddressSchema.safeParse(invalidAddress);
    expect(invalidResult.success).toBe(false);
  });

  it("calculates accurate GST breakdown for intra-state (CGST + SGST) order", () => {
    const product = sampleProducts[0]; // Fender Strat ₹68,500, 18% GST
    const calculation = calculateGST({
      items: [
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.price,
          gstRate: 18,
        },
      ],
      couponDiscount: 0,
      shippingCharge: 0,
      sellerState: "West Bengal",
      buyerState: "West Bengal",
    });

    expect(calculation.isInterState).toBe(false);
    expect(calculation.subtotal).toBe(68500);
    expect(calculation.grandTotal).toBe(68500);
    // CGST + SGST split 9% + 9%
    expect(calculation.totalCgst).toBeGreaterThan(0);
    expect(calculation.totalSgst).toBeGreaterThan(0);
    expect(calculation.totalIgst).toBe(0);
    expect(calculation.totalCgst + calculation.totalSgst).toBeCloseTo(calculation.totalGst, 1);
  });

  it("calculates accurate GST breakdown for inter-state (IGST) order", () => {
    const product = sampleProducts[0]; // ₹68,500
    const calculation = calculateGST({
      items: [
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.price,
          gstRate: 18,
        },
      ],
      couponDiscount: 0,
      shippingCharge: 0,
      sellerState: "West Bengal",
      buyerState: "Maharashtra",
    });

    expect(calculation.isInterState).toBe(true);
    expect(calculation.totalIgst).toBeGreaterThan(0);
    expect(calculation.totalCgst).toBe(0);
    expect(calculation.totalSgst).toBe(0);
    expect(calculation.totalIgst).toBeCloseTo(calculation.totalGst, 1);
  });

  it("applies coupon discounts proportionally across items and computes correct grand total", () => {
    const product1 = sampleProducts[0]; // ₹68,500
    const coupon = sampleCoupons.SAVE10; // 10% off, max 5000

    const discountAmount = calculateCouponDiscountAmount(product1.price, coupon);
    expect(discountAmount).toBe(5000); // capped at 5000

    const calculation = calculateGST({
      items: [
        {
          productId: product1.id,
          name: product1.name,
          quantity: 1,
          unitPrice: product1.price,
          gstRate: 18,
        },
      ],
      couponDiscount: discountAmount,
      shippingCharge: 250,
      sellerState: "West Bengal",
      buyerState: "Karnataka",
    });

    expect(calculation.couponDiscount).toBe(5000);
    expect(calculation.grandTotal).toBe(68500 - 5000 + 250);
  });

  it("validates complete order creation payload with createOrderSchema", () => {
    const orderPayload = {
      items: [
        {
          productId: "prod-fender-strat",
          variantId: "var-strat-sunburst",
          variantSku: "FEN-0144502500",
          variantLabel: "3-Color Sunburst / Maple",
          name: "Fender Player Stratocaster Electric Guitar",
          quantity: 1,
        },
      ],
      email: "buyer@example.com",
      customerName: "Rohan Varma",
      customerPhone: "+91 9876543210",
      couponCode: "SAVE10",
      shippingAddress: {
        name: "Rohan Varma",
        line1: "123 Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560038",
        country: "India",
        phone: "+91 9876543210",
      },
      paymentMethod: "razorpay" as const,
      buyerState: "Karnataka",
      shippingMethod: "standard" as const,
    };

    const parsed = createOrderSchema.safeParse(orderPayload);
    expect(parsed.success).toBe(true);

    // Rejects payment methods other than razorpay
    const invalidPaymentMethod = {
      ...orderPayload,
      paymentMethod: "cod",
    };
    const invalidResult = createOrderSchema.safeParse(invalidPaymentMethod);
    expect(invalidResult.success).toBe(false);
  });

  it("verifies Razorpay payment signatures and webhook HMAC verification", () => {
    const razorpayOrderId = "order_EKwxwAgIt4KiUm";
    const razorpayPaymentId = "pay_29QQoUBi66xm2f";
    const secret = "test_razorpay_secret_key_12345";

    // Generate valid HMAC SHA256 signature
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const isValid = verifyRazorpayPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      validSignature,
      secret,
    );
    expect(isValid).toBe(true);

    // Rejects tampered signature
    const isTampered = verifyRazorpayPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      "tampered_signature_hex",
      secret,
    );
    expect(isTampered).toBe(false);

    // Verify webhook payload HMAC signature
    const webhookPayload = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: razorpayPaymentId, amount: 6850000 } } },
    });
    const webhookSecret = "whsec_test_secret_998877";
    const validWebhookSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(webhookPayload)
      .digest("hex");

    expect(verifyRazorpayWebhookSignature(webhookPayload, validWebhookSig, webhookSecret)).toBe(
      true,
    );
    expect(verifyRazorpayWebhookSignature(webhookPayload, "forged_sig", webhookSecret)).toBe(false);

    // Schema validation for verifyPayment payload
    const verifyPayload = {
      orderId: "ord-test-101",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: validSignature,
    };
    expect(verifyPaymentSchema.safeParse(verifyPayload).success).toBe(true);
  });
});

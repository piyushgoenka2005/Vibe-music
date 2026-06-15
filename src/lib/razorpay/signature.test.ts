import { describe, expect, it } from "vitest";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay/signature";
import crypto from "crypto";

const SECRET = "test_webhook_secret";
const API_SECRET = "test_api_secret";

function signWebhook(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyRazorpayWebhookSignature", () => {
  it("accepts a valid webhook signature", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: {} });
    const signature = signWebhook(body, SECRET);
    expect(verifyRazorpayWebhookSignature(body, signature, SECRET)).toBe(true);
  });

  it("rejects an invalid webhook signature", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: {} });
    expect(verifyRazorpayWebhookSignature(body, "bad-signature", SECRET)).toBe(
      false
    );
  });

  it("rejects tampered payloads", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: {} });
    const signature = signWebhook(body, SECRET);
    const tampered = body.replace("captured", "failed");
    expect(verifyRazorpayWebhookSignature(tampered, signature, SECRET)).toBe(
      false
    );
  });
});

describe("verifyRazorpayPaymentSignature", () => {
  it("accepts a valid payment signature", () => {
    const orderId = "order_test123";
    const paymentId = "pay_test456";
    const body = `${orderId}|${paymentId}`;
    const signature = crypto
      .createHmac("sha256", API_SECRET)
      .update(body)
      .digest("hex");

    expect(
      verifyRazorpayPaymentSignature(orderId, paymentId, signature, API_SECRET)
    ).toBe(true);
  });

  it("rejects an invalid payment signature", () => {
    expect(
      verifyRazorpayPaymentSignature(
        "order_a",
        "pay_b",
        "invalid",
        API_SECRET
      )
    ).toBe(false);
  });
});

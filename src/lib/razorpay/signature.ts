import crypto from "crypto";

export function verifyRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  secret: string
): boolean {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return timingSafeEqual(expected, razorpaySignature);
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function getRazorpayApiSecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("Missing RAZORPAY_KEY_SECRET");
  }
  return secret;
}

export function getRazorpayWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Missing RAZORPAY_WEBHOOK_SECRET");
  }
  return secret;
}

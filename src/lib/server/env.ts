import "server-only";

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Demo payments when Razorpay is off and not production (unless explicitly allowed). */
export function isDemoPaymentsAllowed(): boolean {
  if (process.env.ALLOW_DEMO_PAYMENTS === "true") return true;
  return !isProduction();
}

export function isRazorpayConfigured(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const publicKey =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || keyId;
  return Boolean(keyId && keySecret && publicKey);
}

export function getRazorpayPublicKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ||
    process.env.RAZORPAY_KEY_ID?.trim() ||
    undefined
  );
}

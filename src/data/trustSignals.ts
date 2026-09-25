/**
 * Customer-facing trust copy derived from audit remediations (L-15, L-19, L-21, L-24, L-30).
 * Internal mapping: docs/marketing/VIBEMUSIC_TRUST_USPS.md
 */

export const AUTH_TRUST_BULLETS = [
  "Your orders are private to your account",
  "Secure sign-in",
  "Track purchases anytime",
] as const;

export const CHECKOUT_TRUST_BULLETS = [
  "Server-verified prices at checkout",
  "Stock reserved while you pay",
  "Razorpay-encrypted payments",
] as const;

export const CHECKOUT_TRUST_SUMMARY =
  "Secure checkout in INR — server-verified totals · UPI · Cards · Net Banking";

export const PAYMENT_TRUST_BADGES = [
  "256-bit SSL · PCI-DSS compliant",
  "Powered by Razorpay",
] as const;

export const WHY_SHOP_SECURE_PAYMENTS_SUBTITLE =
  "Razorpay-encrypted checkout with server-verified totals.";

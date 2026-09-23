import "server-only";

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Demo payments when Razorpay is off — never allowed in production. */
export function isDemoPaymentsAllowed(): boolean {
  if (isProduction()) return false;
  return process.env.ALLOW_DEMO_PAYMENTS !== "false";
}

export type RazorpayKeyMode = "live" | "test" | "missing";

export function getRazorpayPublicKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ||
    process.env.RAZORPAY_KEY_ID?.trim() ||
    undefined
  );
}

/** Infer live vs test from key id prefix (never log the full key). */
export function getRazorpayKeyMode(): RazorpayKeyMode {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const publicKey = getRazorpayPublicKey();
  const sample = keyId || publicKey;
  if (!sample) return "missing";
  if (sample.startsWith("rzp_live_")) return "live";
  if (sample.startsWith("rzp_test_")) return "test";
  return "missing";
}

/**
 * vibemusic.in / production must never accept Razorpay test keys
 * (those show the red "Test Mode" ribbon in Checkout).
 */
export function requiresLiveRazorpay(): boolean {
  if (isProduction()) return true;
  const site = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    ""
  ).toLowerCase();
  return site.includes("vibemusic.in");
}

export function isRazorpayConfigured(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const publicKey = getRazorpayPublicKey();
  if (!keyId || !keySecret || !publicKey) return false;

  if (requiresLiveRazorpay()) {
    // Reject test keys on the live storefront so checkout cannot open Test Mode.
    if (!keyId.startsWith("rzp_live_") || !publicKey.startsWith("rzp_live_")) {
      return false;
    }
  }

  return true;
}

/** Throw if production/vibemusic tries to charge with test keys. */
export function assertLiveRazorpayKeys(): void {
  if (!requiresLiveRazorpay()) return;
  const mode = getRazorpayKeyMode();
  if (mode === "live") return;
  throw new Error(
    mode === "test"
      ? "Razorpay is still on test keys. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and NEXT_PUBLIC_RAZORPAY_KEY_ID to rzp_live_… values on the VPS, rebuild, and restart PM2."
      : "Razorpay live keys are missing. Set rzp_live_… keys on the production server.",
  );
}

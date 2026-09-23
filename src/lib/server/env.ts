import "server-only";

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Simulated checkout without Razorpay — opt-in via ALLOW_DEMO_PAYMENTS=true; never in production. */
export function isDemoPaymentsAllowed(): boolean {
  if (isProduction()) return false;
  return process.env.ALLOW_DEMO_PAYMENTS === "true";
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

/** Production must never accept Razorpay test keys (Test Mode ribbon in Checkout). */
export function requiresLiveRazorpay(): boolean {
  return isProduction();
}

/** Human-readable reason when Razorpay cannot open checkout (safe to show in admin/checkout). */
export function describeRazorpayMisconfiguration(): string | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const publicKey = getRazorpayPublicKey();

  if (!keyId || !keySecret) {
    return "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server.";
  }
  if (!publicKey) {
    return "Set NEXT_PUBLIC_RAZORPAY_KEY_ID (must match RAZORPAY_KEY_ID), then rebuild the app.";
  }
  if (keyId !== publicKey) {
    return "RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_ID must match.";
  }
  if (requiresLiveRazorpay() && !keyId.startsWith("rzp_live_")) {
    return "Production requires live Razorpay keys (rzp_live_…). Test keys are rejected.";
  }
  return null;
}

export function isRazorpayConfigured(): boolean {
  return describeRazorpayMisconfiguration() === null;
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

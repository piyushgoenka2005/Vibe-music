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

function cleanRazorpayKey(val?: string): string | undefined {
  const trimmed = val?.trim();
  if (!trimmed) return undefined;
  if (
    /^(your([_-].*)?|changeme.*|xxx+.*|todo.*|replace.*|example.*|placeholder.*|<.*>|rzp_(live|test)_(your|placeholder|test).*)$/i.test(
      trimmed,
    )
  ) {
    return undefined;
  }
  return trimmed;
}

export function getRazorpayPublicKey(): string | undefined {
  return (
    cleanRazorpayKey(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) ||
    cleanRazorpayKey(process.env.RAZORPAY_KEY_ID) ||
    undefined
  );
}

/** Infer live vs test from key id prefix (never log the full key). */
export function getRazorpayKeyMode(): RazorpayKeyMode {
  const keyId = cleanRazorpayKey(process.env.RAZORPAY_KEY_ID);
  const publicKey = getRazorpayPublicKey();
  const sample = keyId || publicKey;
  if (!sample) return "missing";
  if (sample.startsWith("rzp_live_")) return "live";
  if (sample.startsWith("rzp_test_")) return "test";
  return "missing";
}

/** Production on vibemusic.in requires live Razorpay keys unless ALLOW_TEST_RAZORPAY=true. */
export function requiresLiveRazorpay(): boolean {
  if (process.env.ALLOW_TEST_RAZORPAY === "true") return false;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").toLowerCase();
  const isVibeMusicProd = siteUrl.includes("vibemusic.in");
  return isProduction() && isVibeMusicProd;
}

/** Human-readable reason when Razorpay cannot open checkout (safe to show in admin/checkout). */
export function describeRazorpayMisconfiguration(): string | null {
  const keyId = cleanRazorpayKey(process.env.RAZORPAY_KEY_ID);
  const keySecret = cleanRazorpayKey(process.env.RAZORPAY_KEY_SECRET);
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

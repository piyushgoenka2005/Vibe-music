export interface ShippingPolicyInput {
  freeShippingThreshold?: number;
  standardShippingCharge?: number;
}

export interface ShippingPolicyCopy {
  /** Short line for announcement bar / ticker */
  announcement: string;
  /** Cart promo banner + milestones */
  cartBanner: string;
  /** PDP assurance strip */
  pdpDetail: string;
  /** Cart sticky footer when shipping is free */
  cartFooter: string;
  /** Shipping & delivery content page */
  shippingPage: string;
  /** Why-shop / trust blocks */
  whyShop: string;
}

function formatInr(amount: number): string {
  return amount.toLocaleString("en-IN");
}

/** Build storefront shipping copy from admin store settings. */
export function buildShippingPolicyCopy(input: ShippingPolicyInput = {}): ShippingPolicyCopy {
  const threshold = input.freeShippingThreshold ?? 0;
  const charge = Math.max(0, input.standardShippingCharge ?? 0);

  if (threshold <= 0) {
    return {
      announcement: "Free shipping on every order",
      cartBanner: "Free standard shipping on every order",
      pdpDetail: "Free delivery on every order",
      cartFooter: "Free shipping on every order · Taxes included",
      shippingPage:
        "Shipping is free on every order. Delivery timelines vary by pin code — estimate ETA on the product page.",
      whyShop: "Free shipping on every order.",
    };
  }

  const thresholdLabel = `₹${formatInr(threshold)}`;
  const chargeLabel = charge > 0 ? `₹${formatInr(charge)}` : "a standard rate";

  return {
    announcement: `Free shipping on orders over ${thresholdLabel}`,
    cartBanner: `Free standard shipping on orders over ${thresholdLabel}`,
    pdpDetail: `Free delivery on orders over ${thresholdLabel}`,
    cartFooter: `Free shipping over ${thresholdLabel} · Taxes included`,
    shippingPage: `Orders above ${thresholdLabel} qualify for free standard shipping. Below that, shipping from ${chargeLabel} is calculated at checkout based on your pin code. Delivery timelines vary by location — estimate ETA on the product page.`,
    whyShop: `Free shipping on orders over ${thresholdLabel}.`,
  };
}

/** Default copy when store settings are unavailable (threshold 0 = free on every order). */
export const SHIPPING_POLICY: ShippingPolicyCopy = buildShippingPolicyCopy({
  freeShippingThreshold: 0,
  standardShippingCharge: 0,
});

/** Fallback when promotions API has not loaded yet. */
export const STOREFRONT_FREE_SHIPPING_THRESHOLD = 0;

export function storefrontShippingBannerText(input?: ShippingPolicyInput): string {
  return buildShippingPolicyCopy(input).cartBanner;
}

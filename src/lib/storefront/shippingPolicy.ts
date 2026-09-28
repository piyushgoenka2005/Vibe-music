/**
 * Authoritative storefront shipping policy — single source of truth for all UI copy.
 * Checkout quotes ₹0 via resolveAuthoritativeShippingCharge(); threshold stays 0.
 */
export const STOREFRONT_FREE_SHIPPING_THRESHOLD = 0;

export const SHIPPING_POLICY = {
  /** Short line for announcement bar / ticker */
  announcement: "Free shipping on every order",
  /** Cart promo banner + milestones */
  cartBanner: "Free standard shipping on every order",
  /** PDP assurance strip */
  pdpDetail: "Free delivery on every order",
  /** Cart sticky footer when shipping is free */
  cartFooter: "Free shipping on every order · Taxes included",
  /** Shipping & delivery content page */
  shippingPage:
    "Shipping is free on every order. Delivery timelines vary by pin code — estimate ETA on the product page.",
  /** Why-shop / trust blocks */
  whyShop: "Free shipping on every order.",
} as const;

export function storefrontShippingBannerText(): string {
  return SHIPPING_POLICY.cartBanner;
}

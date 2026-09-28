"use client";

import { SHIPPING_POLICY } from "@/lib/storefront/shippingPolicy";
import { useCartStore } from "@/store/cartStore";

export default function CartPromoBanner() {
  const bannerText = useCartStore((s) => s.promoConfig?.bannerText ?? SHIPPING_POLICY.cartBanner);

  return (
    <div className="cart-promo-banner" role="note">
      <span className="cart-promo-banner__icon" aria-hidden="true">
        🎁
      </span>
      <span className="cart-promo-banner__text">{bannerText}</span>
      <span className="cart-promo-banner__icon" aria-hidden="true">
        🎁
      </span>
    </div>
  );
}

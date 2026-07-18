"use client";

import {
  isFreeGiftUnlocked,
  isFreeShippingUnlocked,
} from "@/lib/cart/promoGift";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils/currency";

export default function CartContextMessages() {
  const items = useCartStore((s) => s.items);
  const promoConfig = useCartStore((s) => s.promoConfig);
  const paidSubtotal = useCartStore((s) => s.paidSubtotal());
  const totalSavings = useCartStore((s) => s.totalSavings());
  const discount = useCartStore((s) => s.discount());

  if (items.length === 0) return null;

  const freeShippingThreshold = promoConfig?.freeShippingThreshold ?? 400;
  const freeGiftThreshold = promoConfig?.freeGiftThreshold ?? 799;
  const giftConfigured = Boolean(promoConfig?.giftProductId);

  const shippingUnlocked = isFreeShippingUnlocked(
    paidSubtotal,
    freeShippingThreshold
  );
  const giftUnlocked = isFreeGiftUnlocked(
    paidSubtotal,
    freeGiftThreshold,
    giftConfigured
  );

  const hasDealPricing = items.some(
    (item) =>
      !item.isPromoGift &&
      item.originalPrice != null &&
      item.originalPrice > item.price
  );
  const hasGiftLine = items.some((item) => item.isPromoGift);

  const messages: string[] = [];

  if (totalSavings > 0) {
    messages.push(`You're saving ${formatCurrency(totalSavings)} on this order`);
  }

  if (discount > 0) {
    messages.push(`Coupon applied — ${formatCurrency(discount)} off`);
  }

  if (hasDealPricing) {
    messages.push("Limited-time pricing applied");
  }

  if (shippingUnlocked) {
    messages.push("Eligible for free shipping");
  }

  if (giftUnlocked || hasGiftLine) {
    messages.push("Free accessory included with your order");
  }

  if (messages.length === 0) return null;

  return (
    <div className="cart-context-messages" role="status" aria-live="polite">
      {messages.map((message) => (
        <p key={message} className="cart-context-messages__item">
          {message}
        </p>
      ))}
    </div>
  );
}

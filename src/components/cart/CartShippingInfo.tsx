"use client";

import { buildCartShippingState } from "@/lib/cart/cartShipping";
import { useCartStore } from "@/store/cartStore";
import { Truck } from "lucide-react";

export default function CartShippingInfo() {
  const items = useCartStore((s) => s.items);
  const paidSubtotal = useCartStore((s) => s.paidSubtotal());
  const promoConfig = useCartStore((s) => s.promoConfig);

  if (items.length === 0) return null;

  const shipping = buildCartShippingState(paidSubtotal, promoConfig);

  return (
    <section className="cart-shipping" aria-label="Shipping information">
      <div className="cart-shipping__icon" aria-hidden="true">
        <Truck size={16} strokeWidth={2} />
      </div>
      <div className="cart-shipping__copy">
        <p className="cart-shipping__label">{shipping.label}</p>
        <p className="cart-shipping__detail">{shipping.detail}</p>
        <p className="cart-shipping__eta">Estimated delivery in 3–7 business days</p>
      </div>
      <span
        className={`cart-shipping__amount${shipping.unlocked ? " cart-shipping__amount--free" : ""}`}
      >
        {shipping.amountLabel}
      </span>
    </section>
  );
}

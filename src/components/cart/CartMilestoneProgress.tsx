"use client";

import { buildCartMilestoneState } from "@/lib/cart/cartMilestones";
import { useCartStore } from "@/store/cartStore";

export default function CartMilestoneProgress() {
  const promoConfig = useCartStore((s) => s.promoConfig);
  const paidSubtotal = useCartStore((s) => s.paidSubtotal());

  const { milestones, progressRatio, statusMessage } =
    buildCartMilestoneState(paidSubtotal, promoConfig);

  if (milestones.length === 0) return null;

  const progressPercent = Math.round(progressRatio * 100);

  return (
    <section className="cart-milestone" aria-label="Order rewards progress">
      <p className="cart-milestone__message">{statusMessage}</p>
      <div
        className="cart-milestone__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-label="Reward progress"
      >
        <div
          className="cart-milestone__fill"
          style={{ width: `${progressRatio * 100}%` }}
        />
      </div>
    </section>
  );
}

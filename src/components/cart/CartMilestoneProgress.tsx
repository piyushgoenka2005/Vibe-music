"use client";

import { buildCartMilestoneState } from "@/lib/cart/cartMilestones";
import { useCartStore } from "@/store/cartStore";
import {
  CheckCircle2,
  Gift,
  Package,
  PackageCheck,
  Truck,
} from "lucide-react";

const JOURNEY_STEPS = [
  { id: "order", label: "Order", Icon: Package },
  { id: "shipping", label: "Shipping", Icon: Truck },
  { id: "delivery", label: "Delivery", Icon: PackageCheck },
  { id: "reward", label: "Reward", Icon: Gift },
] as const;

export default function CartMilestoneProgress() {
  const promoConfig = useCartStore((s) => s.promoConfig);
  const paidSubtotal = useCartStore((s) => s.paidSubtotal());

  const { milestones, progressRatio, statusMessage } =
    buildCartMilestoneState(paidSubtotal, promoConfig);

  if (milestones.length === 0) return null;

  const allUnlocked = milestones.every((milestone) => milestone.unlocked);
  const progressPercent = Math.round(progressRatio * 100);

  const activeStepIndex = Math.min(
    JOURNEY_STEPS.length - 1,
    Math.floor(progressRatio * JOURNEY_STEPS.length)
  );

  return (
    <section className="cart-milestone" aria-label="Order rewards progress">
      <div className="cart-milestone__summary">
        <span className="cart-milestone__summary-icon" aria-hidden="true">
          {allUnlocked ? (
            <CheckCircle2 size={18} strokeWidth={2.2} />
          ) : (
            <Gift size={18} strokeWidth={2.2} />
          )}
        </span>
        <div className="cart-milestone__summary-copy">
          <p className="cart-milestone__eyebrow">Order rewards</p>
          <p className="cart-milestone__message">{statusMessage}</p>
        </div>
      </div>

      <div
        className="cart-milestone__journey"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-label="Reward progress"
      >
        <div className="cart-milestone__track">
          <div
            className="cart-milestone__fill"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>

        <ul className="cart-milestone__icons" aria-hidden="true">
          {JOURNEY_STEPS.map((step, index) => {
            const Icon = step.Icon;
            const reached =
              allUnlocked ||
              index <= activeStepIndex ||
              progressRatio >= (index + 1) / JOURNEY_STEPS.length;

            return (
              <li
                key={step.id}
                className="cart-milestone__icon-step"
                data-reached={reached || undefined}
              >
                <span className="cart-milestone__icon-badge">
                  <Icon size={12} strokeWidth={2.2} />
                </span>
                <span className="cart-milestone__icon-label">{step.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

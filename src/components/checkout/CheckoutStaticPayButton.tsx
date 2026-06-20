"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutStaticPayButtonProps {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  loadingLabel?: string;
  hint?: string;
}

export default function CheckoutStaticPayButton({
  onClick,
  disabled = false,
  loading = false,
  label = "Place order (COD)",
  loadingLabel = "Placing order...",
  hint = "Pay when your order arrives",
}: CheckoutStaticPayButtonProps) {
  return (
    <div className="checkout-static-pay">
      <button
        type="button"
        className={cn(
          "checkout-glass-btn checkout-glass-btn--solid checkout-static-pay__btn",
          loading && "checkout-static-pay__btn--loading"
        )}
        disabled={disabled || loading}
        onClick={() => void onClick()}
      >
        <span className="checkout-glass-btn__shine" aria-hidden />
        <span className="checkout-glass-btn__label">
          {loading ? loadingLabel : label}
        </span>
      </button>

      <p className="checkout-swipe__hint">
        <ShieldCheck size={13} strokeWidth={2.25} aria-hidden />
        {hint}
      </p>
    </div>
  );
}

"use client";

import CheckoutGlassButton from "@/components/checkout/CheckoutGlassButton";

interface CheckoutStepActionsProps {
  backHref?: string;
  onBack?: () => void;
  backLabel: string;
  continueLabel: string;
  onContinue: () => void;
  continueDisabled?: boolean;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
}

export default function CheckoutStepActions({
  backHref,
  onBack,
  backLabel,
  continueLabel,
  onContinue,
  continueDisabled = false,
  mobileOnly = false,
  desktopOnly = false,
}: CheckoutStepActionsProps) {
  const className = [
    "checkout-actions",
    "checkout-actions--step",
    mobileOnly ? "checkout-actions--mobile-only" : "",
    desktopOnly ? "checkout-actions--desktop-only" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      {backHref ? (
        <CheckoutGlassButton href={backHref} variant="ghost" className="checkout-actions__back">
          {backLabel}
        </CheckoutGlassButton>
      ) : (
        <CheckoutGlassButton onClick={onBack} variant="ghost" className="checkout-actions__back">
          {backLabel}
        </CheckoutGlassButton>
      )}
      <CheckoutGlassButton onClick={onContinue} variant="solid" disabled={continueDisabled}>
        {continueLabel}
      </CheckoutGlassButton>
    </div>
  );
}

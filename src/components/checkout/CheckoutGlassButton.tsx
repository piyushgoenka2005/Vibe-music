"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { GlassSurface } from "@/components/ui/liquid-glass";

type CheckoutGlassButtonProps = {
  variant?: "primary" | "ghost";
  href?: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
};

export default function CheckoutGlassButton({
  variant = "primary",
  href,
  className,
  children,
  disabled = false,
  onClick,
  type = "button",
}: CheckoutGlassButtonProps) {
  const isPrimary = variant === "primary";

  const shellClass = cn(
    "checkout-glass-btn",
    isPrimary ? "checkout-glass-btn--primary" : "checkout-glass-btn--ghost",
    className
  );

  const surface = (
    <>
      <GlassSurface
        tint={
          isPrimary
            ? "rgba(18, 83, 237, 0.9)"
            : "rgba(255, 255, 255, 0.72)"
        }
      />
      {isPrimary ? <span className="checkout-glass-btn__sheen" aria-hidden /> : null}
      <span className="checkout-glass-btn__label">{children}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link className={shellClass} href={href} onClick={onClick}>
        {surface}
      </Link>
    );
  }

  return (
    <button
      className={shellClass}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {surface}
    </button>
  );
}

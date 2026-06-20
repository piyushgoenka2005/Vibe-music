"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { GlassSurface } from "@/components/ui/liquid-glass";

type CheckoutGlassButtonProps = {
  variant?: "primary" | "solid" | "ghost";
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
  const isSolid = variant === "solid";
  const isGhost = variant === "ghost";

  const shellClass = cn(
    "checkout-glass-btn",
    isSolid
      ? "checkout-glass-btn--solid"
      : isGhost
        ? "checkout-glass-btn--ghost"
        : "checkout-glass-btn--primary",
    className
  );

  const surface = isSolid ? (
    <>
      <span className="checkout-glass-btn__shine" aria-hidden />
      <span className="checkout-glass-btn__label">{children}</span>
    </>
  ) : isGhost ? (
    <span className="checkout-glass-btn__label">{children}</span>
  ) : (
    <>
      <GlassSurface tint="rgba(18, 83, 237, 0.9)" />
      <span className="checkout-glass-btn__sheen" aria-hidden />
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

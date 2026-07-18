"use client";

import { ArrowLeft } from "lucide-react";
import { useStorefrontBack } from "@/hooks/useStorefrontBack";

interface StorefrontBackButtonProps {
  fallbackHref?: string;
  label?: string;
  className?: string;
}

/**
 * Rewinds to the previous in-app page/section (browser history + scroll restore).
 * Falls back to a parent route when there is no prior storefront entry.
 */
export default function StorefrontBackButton({
  fallbackHref,
  label = "Back",
  className = "",
}: StorefrontBackButtonProps) {
  const { goBack } = useStorefrontBack({ fallbackHref });

  return (
    <button
      type="button"
      className={`storefront-back-btn${className ? ` ${className}` : ""}`}
      onClick={goBack}
      aria-label="Go back to the previous page"
    >
      <ArrowLeft size={16} strokeWidth={2.25} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

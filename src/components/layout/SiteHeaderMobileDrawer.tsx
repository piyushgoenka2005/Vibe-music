"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "@/hooks/useIsClient";
import SiteHeaderMobileNav from "@/components/layout/SiteHeaderMobileNav";

interface SiteHeaderMobileDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: () => void;
}

export default function SiteHeaderMobileDrawer({
  open,
  onClose,
  onNavigate,
}: SiteHeaderMobileDrawerProps) {
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open, onClose]);

  if (!isClient || !open) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="site-header__backdrop site-header__backdrop--portaled"
        onClick={onClose}
        aria-label="Close menu"
      />
      <nav
        className="site-header__nav site-header__nav--portaled site-header__nav--open assets-site-header__nav"
        aria-label="Shop categories"
        role="dialog"
        aria-modal="true"
      >
        <SiteHeaderMobileNav onNavigate={onNavigate} />
      </nav>
    </>,
    document.body
  );
}

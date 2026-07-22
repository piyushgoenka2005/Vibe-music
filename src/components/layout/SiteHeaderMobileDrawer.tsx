"use client";

import { createPortal } from "react-dom";
import { type RefObject } from "react";
import { useDialogA11y } from "@/hooks/useCartDrawerA11y";
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
  const navRef = useDialogA11y(open, onClose);

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
        ref={navRef as RefObject<HTMLElement>}
        id="site-header-mobile-nav"
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

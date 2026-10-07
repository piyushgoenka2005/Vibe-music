"use client";

import { Suspense, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useDialogA11y } from "@/hooks/useCartDrawerA11y";
import { useIsClient } from "@/hooks/useIsClient";
import SiteHeaderMobileNav from "@/components/layout/SiteHeaderMobileNav";
import type { MegaMenuItem } from "@/data/headerMegaMenu";

interface SiteHeaderMobileDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: () => void;
  brandsMegaMenu?: MegaMenuItem | null;
}

export default function SiteHeaderMobileDrawer({
  open,
  onClose,
  onNavigate,
  brandsMegaMenu = null,
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
        <Suspense fallback={null}>
          <SiteHeaderMobileNav onNavigate={onNavigate} brandsMegaMenu={brandsMegaMenu} />
        </Suspense>
      </nav>
    </>,
    document.body,
  );
}

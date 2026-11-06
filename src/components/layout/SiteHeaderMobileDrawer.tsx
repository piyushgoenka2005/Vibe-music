"use client";

import { Suspense, useEffect, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useDialogA11y } from "@/hooks/useCartDrawerA11y";
import { useIsClient } from "@/hooks/useIsClient";
import SiteHeaderMobileNav from "@/components/layout/SiteHeaderMobileNav";
import CurrencyLocaleSelector from "@/components/layout/CurrencyLocaleSelector";
import type { MegaMenuItem } from "@/data/headerMegaMenu";

interface SiteHeaderMobileDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: () => void;
  brandsMegaMenu?: MegaMenuItem | null;
  categoryMegaMenus?: MegaMenuItem[] | null;
}

export default function SiteHeaderMobileDrawer({
  open,
  onClose,
  onNavigate,
  brandsMegaMenu = null,
  categoryMegaMenus = null,
}: SiteHeaderMobileDrawerProps) {
  const isClient = useIsClient();
  const navRef = useDialogA11y(open, onClose);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

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
          <SiteHeaderMobileNav
            onNavigate={onNavigate}
            brandsMegaMenu={brandsMegaMenu}
            categoryMegaMenus={categoryMegaMenus}
          />
        </Suspense>
        {/* Drawer footer currency & locale hook */}
        <div
          className="site-header__mobile-drawer-locale-slot"
          aria-hidden="true"
          style={{ display: "none" }}
        >
          <CurrencyLocaleSelector variant="mobile" />
        </div>
      </nav>
    </>,
    document.body,
  );
}

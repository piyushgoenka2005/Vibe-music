"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_NAV_ITEMS } from "./accountNav";
import { isAccountNavActive } from "./accountNavActive";

export default function AccountMobileNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nav = (
    <nav className="acct__mobile-nav" aria-label="Account mobile navigation">
      {ACCOUNT_NAV_ITEMS.filter((item) => item.mobile).map((item) => {
        const Icon = item.icon;
        const isActive = isAccountNavActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`acct__mobile-link${isActive ? " acct__mobile-link--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon strokeWidth={2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  /* Portal out of storefront-main so the blue footer can't cover the bar */
  if (!mounted) return nav;
  return createPortal(nav, document.body);
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_NAV_ITEMS } from "./accountNav";
import { isAccountNavActive } from "./accountNavActive";

export default function AccountMobileNav() {
  const pathname = usePathname();

  return (
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
}

"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import { useAuthStore } from "@/store/authStore";
import { ACCOUNT_LOGOUT, ACCOUNT_NAV_ITEMS } from "./accountNav";
import { isAccountNavActive } from "./accountNavActive";

export default function AccountMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useIsClient();
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

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
      <button
        type="button"
        className="acct__mobile-link acct__mobile-link--logout"
        onClick={() => void handleLogout()}
        aria-label="Log out"
      >
        <ACCOUNT_LOGOUT.icon strokeWidth={2} />
        <span>{ACCOUNT_LOGOUT.label}</span>
      </button>
    </nav>
  );

  /* Portal out of storefront-main so the blue footer can't cover the bar */
  if (!mounted) return nav;
  return createPortal(nav, document.body);
}

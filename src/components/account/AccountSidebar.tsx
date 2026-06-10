"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ACCOUNT_LOGOUT, ACCOUNT_NAV_ITEMS } from "./accountNav";

export default function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <aside className="acct__sidebar" aria-label="Account navigation">
      <nav>
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/account" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`acct__nav-link${isActive ? " acct__nav-link--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="acct__nav-icon" strokeWidth={2} />
              <span className="acct__nav-label">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className="acct__nav-link acct__nav-link--logout"
          onClick={() => void handleLogout()}
        >
          <ACCOUNT_LOGOUT.icon className="acct__nav-icon" strokeWidth={2} />
          <span className="acct__nav-label">{ACCOUNT_LOGOUT.label}</span>
        </button>
      </nav>
    </aside>
  );
}

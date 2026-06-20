"use client";

import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import AccountSidebar from "./AccountSidebar";
import AccountMobileNav from "./AccountMobileNav";
import AccountWelcomeHeader from "./AccountWelcomeHeader";
import "./account.css";

interface AccountDashboardLayoutProps {
  children: React.ReactNode;
}

export default function AccountDashboardLayout({
  children,
}: AccountDashboardLayoutProps) {
  const pathname = usePathname();
  const isOverview = pathname === ROUTES.account;

  return (
    <div className="acct">
      <div className="acct__page">
        {isOverview ? <AccountWelcomeHeader /> : null}
        <div className="acct__layout">
          <AccountSidebar />
          <div className="acct__main">{children}</div>
        </div>
      </div>
      <AccountMobileNav />
    </div>
  );
}

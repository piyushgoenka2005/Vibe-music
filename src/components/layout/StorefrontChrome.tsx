"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SocialRail from "@/components/layout/SocialRail";

export default function StorefrontChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const hideChrome = pathname.startsWith("/admin");

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <div className="storefront-shell">
      <SocialRail />
      <SiteHeader />
      <div className="storefront-main">{children}</div>
      <SiteFooter />
    </div>
  );
}

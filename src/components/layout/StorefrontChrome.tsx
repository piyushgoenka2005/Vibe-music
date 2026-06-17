"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SocialRail from "@/components/layout/SocialRail";
import SkipToContent from "@/components/layout/SkipToContent";
import BackToTop from "@/components/layout/BackToTop";
import HelpWidget from "@/components/layout/HelpWidget";
import SplashCursor from "@/components/SplashCursor";

export default function StorefrontChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const hideChrome = pathname.startsWith("/admin");
  const [splashEnabled, setSplashEnabled] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return undefined;

    setSplashEnabled(true);

    const handleChange = () => {
      setSplashEnabled(!mediaQuery.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <div className="storefront-shell">
      {splashEnabled ? (
        <SplashCursor
          DENSITY_DISSIPATION={3.5}
          VELOCITY_DISSIPATION={2}
          PRESSURE={0.1}
          CURL={3}
          SPLAT_RADIUS={0.2}
          SPLAT_FORCE={6000}
          COLOR_UPDATE_SPEED={10}
          SHADING
          RAINBOW_MODE={false}
          COLOR="#1253ED"
        />
      ) : null}
      <SkipToContent />
      <SocialRail />
      <SiteHeader />
      <div id="main-content" className="storefront-main" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
      <BackToTop />
      <HelpWidget />
    </div>
  );
}

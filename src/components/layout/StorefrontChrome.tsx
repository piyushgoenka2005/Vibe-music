"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SocialRail from "@/components/layout/SocialRail";
import SkipToContent from "@/components/layout/SkipToContent";
import BackToTop from "@/components/layout/BackToTop";
import HelpWidget from "@/components/layout/HelpWidget";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const SplashCursor = dynamic(() => import("@/components/SplashCursor"), {
  ssr: false,
});

const SPLASH_CURSOR_DISABLED =
  process.env.NEXT_PUBLIC_ENABLE_SPLASH_CURSOR === "false";

export default function StorefrontChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const hideChrome = pathname.startsWith("/admin");
  const prefersReducedMotion = usePrefersReducedMotion();
  const splashEnabled =
    !SPLASH_CURSOR_DISABLED && !prefersReducedMotion && !hideChrome;

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <div className="storefront-shell">
      {splashEnabled ? (
        <SplashCursor
          DYE_RESOLUTION={1024}
          DENSITY_DISSIPATION={5.5}
          VELOCITY_DISSIPATION={3.25}
          PRESSURE={0.08}
          CURL={1.75}
          SPLAT_RADIUS={0.12}
          SPLAT_FORCE={3800}
          COLOR_INTENSITY={0.1}
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

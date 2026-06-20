"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SkipToContent from "@/components/layout/SkipToContent";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const SplashCursor = dynamic(() => import("@/components/SplashCursor"), {
  ssr: false,
});

const SocialRail = dynamic(() => import("@/components/layout/SocialRail"), {
  ssr: false,
  loading: () => null,
});

const BackToTop = dynamic(() => import("@/components/layout/BackToTop"), {
  ssr: false,
  loading: () => null,
});

const HelpWidget = dynamic(() => import("@/components/layout/HelpWidget"), {
  ssr: false,
  loading: () => null,
});

const SPLASH_CURSOR_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_SPLASH_CURSOR === "true";

export default function StorefrontChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const hideChrome = pathname.startsWith("/admin");
  const isHomePage = pathname === "/";
  const prefersReducedMotion = usePrefersReducedMotion();
  const splashEnabled =
    isHomePage && SPLASH_CURSOR_ENABLED && !prefersReducedMotion && !hideChrome;

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
      <div className="storefront-main" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
      <BackToTop />
      <HelpWidget />
    </div>
  );
}

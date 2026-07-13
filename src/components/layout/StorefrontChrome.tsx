"use client";

import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { GlassFilter } from "@/components/ui/liquid-glass";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SkipToContent from "@/components/layout/SkipToContent";
import BackToTop from "@/components/layout/BackToTop";
import HelpWidget from "@/components/layout/HelpWidget";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";
import DeferredSplashCursor from "@/components/layout/DeferredSplashCursor";

const SPLASH_CURSOR_DISABLED =
  process.env.NEXT_PUBLIC_ENABLE_SPLASH_CURSOR === "false";

function subscribeNoop() {
  return () => {};
}

function useHasMounted() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

export default function StorefrontChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const hideChrome =
    pathname.startsWith("/admin") || pathname.startsWith("/gp9");
  const isLandingPage = pathname === "/";
  const isProductPage = /^\/product\/[^/]+$/.test(pathname);
  const isListingPage =
    /^\/category\/[^/]+$/.test(pathname) ||
    pathname.startsWith("/search") ||
    pathname === "/deals";
  const isCheckoutOrCart =
    pathname.startsWith("/checkout") || pathname.startsWith("/cart");
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobileViewport = useIsMobileViewport();
  // Viewport/media queries can differ between SSR and the first client paint.
  const hasMounted = useHasMounted();

  const hideMobileFloatingUi =
    hasMounted &&
    isMobileViewport &&
    (isProductPage || isLandingPage || isListingPage || isCheckoutOrCart);
  const showHelpWidget = !hideMobileFloatingUi;
  const showBackToTop = !hideMobileFloatingUi;
  const splashEnabled =
    hasMounted &&
    !SPLASH_CURSOR_DISABLED &&
    !prefersReducedMotion &&
    !hideChrome &&
    !isMobileViewport;

  useLayoutEffect(() => {
    document.body.classList.toggle("is-landing-page", isLandingPage);
    window.dispatchEvent(new Event("site-header:sync"));
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("site-header:sync"));
    });
    return () => document.body.classList.remove("is-landing-page");
  }, [isLandingPage]);

  useEffect(() => {
    if (pathname.startsWith("/checkout") || pathname.startsWith("/cart")) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname]);

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <div className="storefront-shell">
      <GlassFilter />
      <SkipToContent />
      <SiteHeader />
      <div className="storefront-main" id="main-content" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
      {showBackToTop ? <BackToTop /> : null}
      {showHelpWidget ? <HelpWidget /> : null}
      {splashEnabled ? (
        <DeferredSplashCursor
          DYE_RESOLUTION={720}
          SIM_RESOLUTION={64}
          PRESSURE_ITERATIONS={10}
          DENSITY_DISSIPATION={6.5}
          VELOCITY_DISSIPATION={2.75}
          PRESSURE={0.08}
          CURL={1.75}
          SPLAT_RADIUS={0.11}
          ZONE_SPLAT_RADIUS={0.09}
          SPLAT_FORCE={2600}
          COLOR_INTENSITY={0.08}
          COLOR_UPDATE_SPEED={10}
          SHADING
          RAINBOW_MODE={false}
          COLOR="#1253ED"
          ZONE_COLOR="#FFFFFF"
          ZONE_COLOR_INTENSITY={0.08}
          ZONE_SELECTORS='[data-vibe-section="footer"], [data-footer-panel]'
        />
      ) : null}
    </div>
  );
}

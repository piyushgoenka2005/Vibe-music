"use client";

import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { GlassFilter } from "@/components/ui/liquid-glass";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SkipToContent from "@/components/layout/SkipToContent";
import BackToTop from "@/components/layout/BackToTop";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";
import DeferredSplashCursor from "@/components/layout/DeferredSplashCursor";
import { ROUTES } from "@/lib/routes";

const HelpWidget = dynamic(() => import("@/components/layout/HelpWidget"), {
  ssr: false,
  loading: () => null,
});

const SPLASH_CURSOR_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_SPLASH_CURSOR !== "false";

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
    pathname === ROUTES.categories ||
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
    SPLASH_CURSOR_ENABLED &&
    !prefersReducedMotion &&
    !hideChrome &&
    !isMobileViewport;

  useLayoutEffect(() => {
    const hasFooterReveal = isLandingPage || isProductPage;
    document.body.classList.toggle("is-landing-page", isLandingPage);
    document.body.classList.toggle("is-product-page", isProductPage);
    document.body.classList.toggle("has-footer-reveal", hasFooterReveal);
    window.dispatchEvent(new Event("site-header:sync"));
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("site-header:sync"));
    });
    return () => {
      document.body.classList.remove(
        "is-landing-page",
        "is-product-page",
        "has-footer-reveal"
      );
    };
  }, [isLandingPage, isProductPage]);

  useEffect(() => {
    if (pathname.startsWith("/checkout") || pathname.startsWith("/cart")) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname]);

  if (hideChrome) {
    return <>{children}</>;
  }

  const shellClassName = [
    "storefront-shell",
    isLandingPage ? "is-landing-page" : "",
    isProductPage ? "is-product-page" : "",
    isLandingPage || isProductPage ? "has-footer-reveal" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClassName}>
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
          DYE_RESOLUTION={480}
          SIM_RESOLUTION={64}
          PRESSURE_ITERATIONS={8}
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

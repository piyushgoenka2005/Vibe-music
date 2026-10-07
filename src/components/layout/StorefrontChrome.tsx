"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
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
import { isMobileWhatsAppPath } from "@/data/helpWidget";
import { ROUTES } from "@/lib/routes";
import type { MegaMenuItem } from "@/data/headerMegaMenu";
import type { PublicLegalInfo } from "@/types/publicLegal";

const HelpWidget = dynamic(() => import("@/components/layout/HelpWidget"), {
  ssr: false,
  loading: () => null,
});

const MobileWhatsAppButton = dynamic(() => import("@/components/layout/MobileWhatsAppButton"), {
  ssr: false,
  loading: () => null,
});

const SPLASH_CURSOR_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SPLASH_CURSOR !== "false";

function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.hardwareConcurrency <= 4 || /Android [1-8]\./i.test(navigator.userAgent);
}

function subscribeNoop() {
  return () => {};
}

function useHasMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

export default function StorefrontChrome({
  children,
  legal,
  shippingAnnouncement,
  brandsMegaMenu = null,
}: {
  children: React.ReactNode;
  legal: PublicLegalInfo;
  shippingAnnouncement?: string;
  brandsMegaMenu?: MegaMenuItem | null;
}) {
  const pathname = usePathname() ?? "";
  const hideChrome = pathname.startsWith("/admin") || pathname.startsWith("/gp9");
  const isLandingPage = pathname === "/";
  const isProductPage = /^\/product\/[^/]+$/.test(pathname);
  const isAccountPage = pathname.startsWith("/account");
  const isListingPage =
    pathname === ROUTES.categories ||
    /^\/category\/[^/]+$/.test(pathname) ||
    pathname.startsWith("/search") ||
    pathname === "/deals";
  const isCheckoutOrCart = pathname.startsWith("/checkout") || pathname.startsWith("/cart");
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password");
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobileViewport = useIsMobileViewport();
  // Viewport/media queries can differ between SSR and the first client paint.
  const hasMounted = useHasMounted();

  const hideMobileFloatingUi =
    hasMounted &&
    isMobileViewport &&
    (isProductPage || isLandingPage || isListingPage || isCheckoutOrCart || isAuthPage);
  const showHelpWidget = !hideMobileFloatingUi;
  const showBackToTop = !hideMobileFloatingUi;
  const showMobileWhatsApp = hasMounted && isMobileViewport && isMobileWhatsAppPath(pathname);
  const splashEnabled =
    hasMounted &&
    SPLASH_CURSOR_ENABLED &&
    !prefersReducedMotion &&
    !hideChrome &&
    !isCheckoutOrCart &&
    !isAuthPage;

  useLayoutEffect(() => {
    const hasFooterReveal = isLandingPage || isProductPage;
    document.body.classList.toggle("is-landing-page", isLandingPage);
    document.body.classList.toggle("is-product-page", isProductPage);
    document.body.classList.toggle("is-account-page", isAccountPage);
    document.body.classList.toggle("is-auth-page", isAuthPage);
    document.body.classList.toggle("has-footer-reveal", hasFooterReveal);

    if (isAuthPage || pathname.startsWith("/checkout") || pathname.startsWith("/cart")) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    window.dispatchEvent(new Event("site-header:sync"));
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("site-header:sync"));
    });
    return () => {
      document.body.classList.remove(
        "is-landing-page",
        "is-product-page",
        "is-account-page",
        "is-auth-page",
        "has-footer-reveal",
      );
    };
  }, [isLandingPage, isProductPage, isAccountPage, isAuthPage, pathname]);

  if (hideChrome) {
    return <>{children}</>;
  }

  const lowEndDevice = hasMounted && isLowEndDevice();
  const mobileOrLowEnd = hasMounted && (isMobileViewport || lowEndDevice);

  const shellClassName = [
    "storefront-shell",
    isLandingPage ? "is-landing-page" : "",
    isProductPage ? "is-product-page" : "",
    isAuthPage ? "is-auth-page" : "",
    isLandingPage || isProductPage ? "has-footer-reveal" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClassName}>
      <GlassFilter />
      <SkipToContent />
      <SiteHeader shippingAnnouncement={shippingAnnouncement} brandsMegaMenu={brandsMegaMenu} />
      <div className="storefront-main" id="main-content" tabIndex={-1}>
        {children}
      </div>
      {!isAuthPage ? <SiteFooter legal={legal} /> : null}
      {showBackToTop ? <BackToTop /> : null}
      {showHelpWidget ? <HelpWidget /> : null}
      {showMobileWhatsApp ? <MobileWhatsAppButton /> : null}
      {splashEnabled ? (
        <DeferredSplashCursor
          DYE_RESOLUTION={mobileOrLowEnd ? 256 : 384}
          SIM_RESOLUTION={mobileOrLowEnd ? 40 : 64}
          PRESSURE_ITERATIONS={mobileOrLowEnd ? 4 : 6}
          DENSITY_DISSIPATION={6.5}
          VELOCITY_DISSIPATION={2.75}
          PRESSURE={0.08}
          CURL={1.75}
          SPLAT_RADIUS={mobileOrLowEnd ? 0.14 : 0.11}
          ZONE_SPLAT_RADIUS={0.09}
          SPLAT_FORCE={mobileOrLowEnd ? 3200 : 2600}
          COLOR_INTENSITY={mobileOrLowEnd ? 0.1 : 0.08}
          COLOR_UPDATE_SPEED={10}
          SHADING={!mobileOrLowEnd}
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

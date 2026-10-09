"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback } from "react";
import { usePathname } from "next/navigation";
import AuthProvider from "@/components/auth/AuthProvider";
import ToastContainer from "@/components/common/ToastContainer";
import DeferredGlobalSearch from "@/components/layout/DeferredGlobalSearch";
import StorefrontChrome from "@/components/layout/StorefrontChrome";
import DeferredHtmlLinkInterceptor from "@/components/vibe/DeferredHtmlLinkInterceptor";
import NextAuthSessionProvider from "@/providers/SessionProvider";
import WebVitalsReporter from "@/components/performance/WebVitalsReporter";
import RoutePreloader from "@/components/layout/RoutePreloader";
import {
  PENDING_POP_RESTORE_KEY,
  ROUTE_SCROLL_RESET_PX,
  SCROLL_POSITIONS_KEY,
  parsePendingPopRestore,
  shouldSkipSplashScrollToTop,
} from "@/lib/navigation/scrollRestore";
import ScrollRestoration from "@/components/layout/ScrollRestoration";
import PageLoadSplash, { isPageLoadSplashEnabled } from "@/components/layout/PageLoadSplash";
import SplashPendingClear from "@/components/layout/SplashPendingClear";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import SupportChatLoader from "@/components/support/SupportChatLoader";
import DevExtensionNoiseFilter from "@/components/dev/DevExtensionNoiseFilter";
import type { MegaMenuItem } from "@/data/headerMegaMenu";
import type { PublicLegalInfo } from "@/types/publicLegal";

const ENABLE_PAGE_LOAD_SPLASH = isPageLoadSplashEnabled();

const StorefrontDrawers = dynamic(() => import("@/components/layout/StorefrontDrawers"), {
  ssr: false,
  loading: () => null,
});

export default function AppShell({
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
  const isAdmin = pathname.startsWith("/admin");

  /** Splash only covers the UI — storefront mounts immediately so data/images load underneath. */
  const handleSplashComplete = useCallback(() => {
    if (typeof window === "undefined") return;
    // Don't yank to the hero if Back restore already has a mid-page target.
    try {
      const key = `${window.location.pathname}${window.location.search}`;
      const raw = sessionStorage.getItem(SCROLL_POSITIONS_KEY);
      let savedY: number | undefined;
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>;
        savedY = parsed?.[key];
      }
      const pending = parsePendingPopRestore(sessionStorage.getItem(PENDING_POP_RESTORE_KEY));
      const intentionalBack = sessionStorage.getItem("vibe:nav-back-intent") === key;
      if (
        shouldSkipSplashScrollToTop({
          savedY,
          pendingPopMatches: pending?.key === key,
          intentionalBack,
          resetPx: ROUTE_SCROLL_RESET_PX,
        })
      ) {
        return;
      }
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  if (isAdmin) {
    return (
      <NextAuthSessionProvider>
        <AuthProvider>
          <ToastContainer />
          {children}
        </AuthProvider>
      </NextAuthSessionProvider>
    );
  }

  return (
    <NextAuthSessionProvider>
      <AuthProvider>
        <SplashPendingClear />
        {ENABLE_PAGE_LOAD_SPLASH ? <PageLoadSplash onComplete={handleSplashComplete} /> : null}
        <WebVitalsReporter />
        <DevExtensionNoiseFilter />
        <AnalyticsProvider />
        <SupportChatLoader />
        <ServiceWorkerRegister />
        <RoutePreloader />
        <Suspense fallback={null}>
          <ScrollRestoration />
        </Suspense>
        <div className="storefront-root">
          <StorefrontChrome
            legal={legal}
            shippingAnnouncement={shippingAnnouncement}
            brandsMegaMenu={brandsMegaMenu}
          >
            <DeferredHtmlLinkInterceptor />
            <DeferredGlobalSearch />
            <StorefrontDrawers />
            <ToastContainer />
            {children}
          </StorefrontChrome>
        </div>
      </AuthProvider>
    </NextAuthSessionProvider>
  );
}

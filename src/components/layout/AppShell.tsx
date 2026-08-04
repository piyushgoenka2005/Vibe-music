"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback } from "react";
import { usePathname } from "next/navigation";
import AuthProvider from "@/components/auth/AuthProvider";
import ToastContainer from "@/components/common/ToastContainer";
import DeferredGlobalSearch from "@/components/layout/DeferredGlobalSearch";
import StorefrontChrome from "@/components/layout/StorefrontChrome";
import DeferredHtmlLinkInterceptor from "@/components/vibe/DeferredHtmlLinkInterceptor";
import QueryProvider from "@/providers/QueryProvider";
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
import PageLoadSplash, {
  isPageLoadSplashEnabled,
} from "@/components/layout/PageLoadSplash";
import SplashPendingClear from "@/components/layout/SplashPendingClear";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";

const ENABLE_PAGE_LOAD_SPLASH = isPageLoadSplashEnabled();

const StorefrontDrawers = dynamic(
  () => import("@/components/layout/StorefrontDrawers"),
  { ssr: false, loading: () => null }
);

export default function AppShell({ children }: { children: React.ReactNode }) {
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
      const pending = parsePendingPopRestore(
        sessionStorage.getItem(PENDING_POP_RESTORE_KEY)
      );
      const intentionalBack =
        sessionStorage.getItem("vibe:nav-back-intent") === key;
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
      <QueryProvider>
        <NextAuthSessionProvider>
          <AuthProvider>
            <ToastContainer />
            {children}
          </AuthProvider>
        </NextAuthSessionProvider>
      </QueryProvider>
    );
  }

  return (
    <QueryProvider>
      <NextAuthSessionProvider>
        <AuthProvider>
          <SplashPendingClear />
          {ENABLE_PAGE_LOAD_SPLASH ? (
            <PageLoadSplash onComplete={handleSplashComplete} />
          ) : null}
          <WebVitalsReporter />
          <AnalyticsProvider />
          <ServiceWorkerRegister />
          <RoutePreloader />
          <Suspense fallback={null}>
            <ScrollRestoration />
          </Suspense>
          <div className="storefront-root">
            <StorefrontChrome>
              <DeferredHtmlLinkInterceptor />
              <DeferredGlobalSearch />
              <StorefrontDrawers />
              <ToastContainer />
              {children}
            </StorefrontChrome>
          </div>
        </AuthProvider>
      </NextAuthSessionProvider>
    </QueryProvider>
  );
}

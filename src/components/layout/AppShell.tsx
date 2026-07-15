"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
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
import ScrollRestoration from "@/components/layout/ScrollRestoration";
import PageLoadSplash, {
  isPageLoadSplashEnabled,
} from "@/components/layout/PageLoadSplash";
import SplashPendingClear from "@/components/layout/SplashPendingClear";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";

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
          <ServiceWorkerRegister />
          <RoutePreloader />
          <ScrollRestoration />
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

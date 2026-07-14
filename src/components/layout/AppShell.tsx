"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
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
  shouldShowInitialSplash,
} from "@/components/layout/PageLoadSplash";

const ENABLE_PAGE_LOAD_SPLASH = isPageLoadSplashEnabled();

function initialStorefrontUnlocked(): boolean {
  if (!ENABLE_PAGE_LOAD_SPLASH) return true;
  if (typeof window === "undefined") return false;
  return !shouldShowInitialSplash();
}

const StorefrontDrawers = dynamic(
  () => import("@/components/layout/StorefrontDrawers"),
  { ssr: false, loading: () => null }
);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isAdmin = pathname.startsWith("/admin");
  const [storefrontUnlocked, setStorefrontUnlocked] = useState(
    initialStorefrontUnlocked
  );

  const handleSplashComplete = useCallback(() => {
    setStorefrontUnlocked(true);
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
          {ENABLE_PAGE_LOAD_SPLASH ? (
            <PageLoadSplash onComplete={handleSplashComplete} />
          ) : null}
          {storefrontUnlocked ? (
            <>
              <WebVitalsReporter />
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
            </>
          ) : null}
        </AuthProvider>
      </NextAuthSessionProvider>
    </QueryProvider>
  );
}

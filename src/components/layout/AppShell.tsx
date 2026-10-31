"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import AuthProvider from "@/components/auth/AuthProvider";
import ToastContainer from "@/components/common/ToastContainer";
import DeferredGlobalSearch from "@/components/layout/DeferredGlobalSearch";
import StorefrontChrome from "@/components/layout/StorefrontChrome";
import DeferredHtmlLinkInterceptor from "@/components/vibe/DeferredHtmlLinkInterceptor";
import NextAuthSessionProvider from "@/providers/SessionProvider";
import WebVitalsReporter from "@/components/performance/WebVitalsReporter";
import RoutePreloader from "@/components/layout/RoutePreloader";
import ScrollRestoration from "@/components/layout/ScrollRestoration";
import SplashPendingClear from "@/components/layout/SplashPendingClear";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import StorefrontLiveRefresh from "@/components/layout/StorefrontLiveRefresh";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import SupportChatLoader from "@/components/support/SupportChatLoader";
import DevExtensionNoiseFilter from "@/components/dev/DevExtensionNoiseFilter";
import type { MegaMenuItem } from "@/data/headerMegaMenu";
import type { PublicLegalInfo } from "@/types/publicLegal";

const StorefrontDrawers = dynamic(() => import("@/components/layout/StorefrontDrawers"), {
  ssr: false,
  loading: () => null,
});

export default function AppShell({
  children,
  legal,
  shippingAnnouncement,
  brandsMegaMenu = null,
  categoryMegaMenus = null,
}: {
  children: React.ReactNode;
  legal: PublicLegalInfo;
  shippingAnnouncement?: string;
  brandsMegaMenu?: MegaMenuItem | null;
  categoryMegaMenus?: MegaMenuItem[] | null;
}) {
  const pathname = usePathname() ?? "";
  const isAdmin = pathname.startsWith("/admin");

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
        <WebVitalsReporter />
        <DevExtensionNoiseFilter />
        <AnalyticsProvider />
        <SupportChatLoader />
        <ServiceWorkerRegister />
        <StorefrontLiveRefresh />
        <RoutePreloader />
        <Suspense fallback={null}>
          <ScrollRestoration />
        </Suspense>
        <div className="storefront-root">
          <StorefrontChrome
            legal={legal}
            shippingAnnouncement={shippingAnnouncement}
            brandsMegaMenu={brandsMegaMenu}
            categoryMegaMenus={categoryMegaMenus}
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

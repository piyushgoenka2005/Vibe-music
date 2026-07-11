"use client";

import dynamic from "next/dynamic";
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
import PageLoadSplash from "@/components/layout/PageLoadSplash";

const StorefrontDrawers = dynamic(
  () => import("@/components/layout/StorefrontDrawers"),
  { ssr: false, loading: () => null }
);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isAdmin = pathname.startsWith("/admin");

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
          <PageLoadSplash />
          <WebVitalsReporter />
          <RoutePreloader />
          <StorefrontChrome>
            <DeferredHtmlLinkInterceptor />
            <DeferredGlobalSearch />
            <StorefrontDrawers />
            <ToastContainer />
            {children}
          </StorefrontChrome>
        </AuthProvider>
      </NextAuthSessionProvider>
    </QueryProvider>
  );
}

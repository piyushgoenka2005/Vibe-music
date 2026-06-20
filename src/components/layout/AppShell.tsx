"use client";

import { usePathname } from "next/navigation";
import AuthProvider from "@/components/auth/AuthProvider";
import ToastContainer from "@/components/common/ToastContainer";
import DeferredGlobalSearch from "@/components/layout/DeferredGlobalSearch";
import StorefrontChrome from "@/components/layout/StorefrontChrome";
import StorefrontDrawers from "@/components/layout/StorefrontDrawers";
import DeferredHtmlLinkInterceptor from "@/components/vibe/DeferredHtmlLinkInterceptor";
import QueryProvider from "@/providers/QueryProvider";
import StorefrontThemeProvider from "@/components/theme/StorefrontThemeProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <QueryProvider>
        <ToastContainer />
        {children}
      </QueryProvider>
    );
  }

  return (
    <QueryProvider>
      <AuthProvider>
        <StorefrontThemeProvider>
          <StorefrontChrome>
            <DeferredHtmlLinkInterceptor />
            <DeferredGlobalSearch />
            <StorefrontDrawers />
            <ToastContainer />
            {children}
          </StorefrontChrome>
        </StorefrontThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLoginRedirectUrl } from "@/lib/auth/protected-routes";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";

/** @deprecated Prefer ProtectedRoute layout wrapper */
export function useRequireAuth(redirectTo = ROUTES.login) {
  const router = useRouter();
  const pathname = usePathname();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace(getLoginRedirectUrl(pathname || redirectTo));
    }
  }, [isAuthenticated, isInitialized, pathname, redirectTo, router]);

  return { isInitialized, isAuthenticated };
}

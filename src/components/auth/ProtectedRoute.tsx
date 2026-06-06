"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLoginRedirectUrl } from "@/lib/auth/protected-routes";
import { useAuthStore } from "@/store/authStore";
import AuthLoading from "@/components/auth/AuthLoading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace(getLoginRedirectUrl(pathname));
    }
  }, [isAuthenticated, isInitialized, pathname, router]);

  if (!isInitialized || !isAuthenticated) {
    return <AuthLoading />;
  }

  return children;
}

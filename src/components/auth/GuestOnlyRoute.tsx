"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLoading from "@/components/auth/AuthLoading";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";

interface GuestOnlyRouteProps {
  children: React.ReactNode;
  fallback?: string;
}

function GuestOnlyRouteInner({
  children,
  fallback = ROUTES.account,
}: GuestOnlyRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || fallback;
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isInitialized, redirectTo, router]);

  if (!isInitialized || isAuthenticated) {
    return <AuthLoading />;
  }

  return children;
}

export default function GuestOnlyRoute(props: GuestOnlyRouteProps) {
  return (
    <Suspense fallback={<AuthLoading />}>
      <GuestOnlyRouteInner {...props} />
    </Suspense>
  );
}

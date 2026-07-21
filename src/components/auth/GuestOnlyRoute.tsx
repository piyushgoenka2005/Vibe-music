"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLoading from "@/components/auth/AuthLoading";
import { ROUTES } from "@/lib/routes";
import { sanitizeAuthRedirect } from "@/lib/auth/safeRedirect";
import { useAuthStore } from "@/store/authStore";

interface GuestOnlyRouteProps {
  children: React.ReactNode;
  fallback?: string;
}

const INIT_TIMEOUT_MS = 7000;

function GuestOnlyRouteInner({
  children,
  fallback = ROUTES.account,
}: GuestOnlyRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeAuthRedirect(searchParams.get("redirect"), fallback);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isInitialized) return;
    const timer = window.setTimeout(() => setTimedOut(true), INIT_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized && !timedOut) return;
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isInitialized, timedOut, redirectTo, router]);

  if ((!isInitialized && !timedOut) || isAuthenticated) {
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

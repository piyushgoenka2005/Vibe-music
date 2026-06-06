"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";

export function useRequireAuth(redirectTo = ROUTES.login) {
  const router = useRouter();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isInitialized, redirectTo, router]);

  return { isInitialized, isAuthenticated };
}

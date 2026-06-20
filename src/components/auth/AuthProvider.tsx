"use client";

import { useEffect } from "react";
import { completeGoogleRedirectSignIn } from "@/services/auth/auth.service";
import { useAuthStore } from "@/store/authStore";

const AUTH_INIT_DELAY_MS = 500;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const timer = window.setTimeout(() => {
      void completeGoogleRedirectSignIn().catch(() => undefined);
      cleanup = useAuthStore.getState().initializeAuth();
    }, AUTH_INIT_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      cleanup?.();
    };
  }, []);

  return children;
}

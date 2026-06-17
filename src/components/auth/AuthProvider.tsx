"use client";

import { useEffect } from "react";
import { completeGoogleRedirectSignIn } from "@/services/auth/auth.service";
import { useAuthStore } from "@/store/authStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void completeGoogleRedirectSignIn().catch(() => undefined);
    return useAuthStore.getState().initializeAuth();
  }, []);

  return children;
}

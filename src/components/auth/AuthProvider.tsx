"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/authStore";
import { mergeGuestCartOnAuth } from "@/lib/cart/mergeGuestCart";

const SESSION_FAIL_OPEN_MS = 6000;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const setSessionUser = useAuthStore((s) => s.setSessionUser);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
  const setAuthInitialized = useAuthStore((s) => s.setAuthInitialized);

  useEffect(() => {
    if (status === "loading") {
      setAuthLoading(true);
      // If /api/auth/session hangs (misconfigured Auth.js), don't trap the UI forever.
      const failOpen = window.setTimeout(() => {
        if (useAuthStore.getState().isInitialized) return;
        setSessionUser(null);
        setAuthInitialized(true);
        setAuthLoading(false);
      }, SESSION_FAIL_OPEN_MS);
      return () => window.clearTimeout(failOpen);
    }

    if (session?.user?.id && session.user.email) {
      setSessionUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name?.trim() || session.user.email.split("@")[0] || "User",
        photoURL: session.user.image ?? null,
      });
      mergeGuestCartOnAuth();
    } else {
      setSessionUser(null);
    }

    setAuthInitialized(true);
    setAuthLoading(false);
  }, [session, status, setSessionUser, setAuthLoading, setAuthInitialized]);

  return children;
}

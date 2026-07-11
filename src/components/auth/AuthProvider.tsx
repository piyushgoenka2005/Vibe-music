"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/authStore";
import { mergeGuestCartOnAuth } from "@/lib/cart/mergeGuestCart";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const setSessionUser = useAuthStore((s) => s.setSessionUser);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
  const setAuthInitialized = useAuthStore((s) => s.setAuthInitialized);

  useEffect(() => {
    if (status === "loading") {
      setAuthLoading(true);
      return;
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

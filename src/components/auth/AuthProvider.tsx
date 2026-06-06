"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    return useAuthStore.getState().initializeAuth();
  }, []);

  return children;
}

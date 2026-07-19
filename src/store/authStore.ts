"use client";

import { create } from "zustand";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { mergeGuestCartOnAuth, snapshotGuestCart } from "@/lib/cart/mergeGuestCart";
import { useCartStore } from "@/store/cartStore";
import type { AppUser, SignInInput, SignUpInput } from "@/types/user";

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  signUp: (input: SignUpInput) => Promise<AppUser>;
  signIn: (input: SignInInput & { rememberMe?: boolean }) => Promise<AppUser>;
  signInWithGoogle: (callbackUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<AppUser>;
  clearError: () => void;
  setSessionUser: (user: AppUser | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthInitialized: (initialized: boolean) => void;
}

function mapSessionUser(user: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}): AppUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name?.trim() || user.email.split("@")[0] || "User",
    photoURL: user.image ?? null,
  };
}

async function credentialsSignIn(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<AppUser> {
  const result = await nextAuthSignIn("credentials", {
    email,
    password,
    remember: rememberMe ? "true" : "false",
    redirect: false,
  });

  if (result?.error) {
    throw new Error(result.error);
  }

  const sessionRes = await fetch("/api/auth/session");
  const session = (await sessionRes.json()) as {
    user?: { id: string; email: string; name?: string | null; image?: string | null };
  };

  if (!session.user?.id) {
    throw new Error("CredentialsSignin");
  }

  return mapSessionUser(session.user);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  setSessionUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
      isLoading: false,
    }),

  setAuthLoading: (isLoading) => set({ isLoading }),

  setAuthInitialized: (isInitialized) => set({ isInitialized }),

  signUp: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.displayName ?? input.email.split("@")[0],
          email: input.email,
          password: input.password,
          confirmPassword: input.password,
        }),
      });

      if (!registerRes.ok) {
        const payload = (await registerRes.json()) as { error?: string };
        throw new Error(payload.error ?? "Sign up failed.");
      }

      const user = await credentialsSignIn(input.email, input.password, false);
      mergeGuestCartOnAuth();
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      set({
        error: getAuthErrorMessage(error, "Sign up failed."),
        isLoading: false,
      });
      throw error;
    }
  },

  signIn: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const user = await credentialsSignIn(
        input.email,
        input.password,
        input.rememberMe ?? false
      );
      mergeGuestCartOnAuth();
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      set({
        error: getAuthErrorMessage(error, "Sign in failed."),
        isLoading: false,
      });
      throw error;
    }
  },

  signInWithGoogle: async (callbackUrl = "/account") => {
    set({ isLoading: true, error: null });
    try {
      const { sanitizeAuthRedirect } = await import("@/lib/auth/safeRedirect");
      await nextAuthSignIn("google", {
        callbackUrl: sanitizeAuthRedirect(callbackUrl, "/account"),
      });
    } catch (error) {
      set({
        error: getAuthErrorMessage(error, "Google sign in failed."),
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      snapshotGuestCart(useCartStore.getState().items);
      await nextAuthSignOut({ redirect: false });
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: getAuthErrorMessage(error, "Logout failed."),
        isLoading: false,
      });
      throw error;
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Password reset failed.");
      }
      set({ isLoading: false });
    } catch (error) {
      set({
        error: getAuthErrorMessage(error, "Password reset failed."),
        isLoading: false,
      });
      throw error;
    }
  },

  updateDisplayName: async (displayName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Profile update failed.");
      }
      const payload = (await response.json()) as {
        user: { id: string; email: string; name: string };
      };
      const user = mapSessionUser(payload.user);
      set({ user, isLoading: false });
      return user;
    } catch (error) {
      set({
        error: getAuthErrorMessage(error, "Profile update failed."),
        isLoading: false,
      });
      throw error;
    }
  },
}));

export type { AppUser as User };

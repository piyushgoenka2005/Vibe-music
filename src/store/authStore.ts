"use client";

import { create } from "zustand";
import {
  forgotPassword,
  getCurrentIdToken,
  logout as firebaseLogout,
  signIn,
  signInWithGoogle,
  signUp,
  subscribeToAuthState,
  syncServerSession,
} from "@/services/auth/auth.service";
import type { AppUser, SignInInput, SignUpInput } from "@/types/user";

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  signUp: (input: SignUpInput) => Promise<AppUser>;
  signIn: (input: SignInInput) => Promise<AppUser>;
  signInWithGoogle: () => Promise<AppUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  initializeAuth: () => () => void;
}

let unsubscribeAuth: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  signUp: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const user = await signUp(input);
      const idToken = await getCurrentIdToken(true);
      await syncServerSession(idToken);
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign up failed.";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  signIn: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const user = await signIn(input);
      const idToken = await getCurrentIdToken(true);
      await syncServerSession(idToken);
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign in failed.";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await signInWithGoogle();
      const idToken = await getCurrentIdToken(true);
      await syncServerSession(idToken);
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Google sign in failed.";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await syncServerSession(null);
      await firebaseLogout();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Logout failed.";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await forgotPassword(email);
      set({ isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Password reset failed.";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  initializeAuth: () => {
    if (unsubscribeAuth) {
      return unsubscribeAuth;
    }

    set({ isLoading: true });

    unsubscribeAuth = subscribeToAuthState(async (user) => {
      if (user) {
        const idToken = await getCurrentIdToken();
        await syncServerSession(idToken);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
        return;
      }

      await syncServerSession(null);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    });

    return () => {
      unsubscribeAuth?.();
      unsubscribeAuth = null;
    };
  },
}));

export type { AppUser as User };

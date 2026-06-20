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
  updateDisplayName as updateDisplayNameService,
} from "@/services/auth/auth.service";
import { getFirebaseErrorMessage } from "@/lib/auth/firebase-errors";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";
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
  signIn: (input: SignInInput) => Promise<AppUser>;
  signInWithGoogle: () => Promise<AppUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<AppUser>;
  clearError: () => void;
  initializeAuth: () => () => void;
}

let unsubscribeAuth: (() => void) | null = null;
let lastSyncedUserId: string | null | undefined;

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
      mergeGuestCartOnAuth();
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      set({
        error: getFirebaseErrorMessage(error, "Sign up failed."),
        isLoading: false,
      });
      throw error;
    }
  },

  signIn: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const user = await signIn(input);
      const idToken = await getCurrentIdToken(true);
      await syncServerSession(idToken);
      mergeGuestCartOnAuth();
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      set({
        error: getFirebaseErrorMessage(error, "Sign in failed."),
        isLoading: false,
      });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await signInWithGoogle();
      const idToken = await getCurrentIdToken(true);
      await syncServerSession(idToken);
      mergeGuestCartOnAuth();
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (error) {
      set({
        error: getFirebaseErrorMessage(error, "Google sign in failed."),
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      snapshotGuestCart(useCartStore.getState().items);
      await syncServerSession(null);
      await firebaseLogout();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: getFirebaseErrorMessage(error, "Logout failed."),
        isLoading: false,
      });
      throw error;
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await forgotPassword(email);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: getFirebaseErrorMessage(error, "Password reset failed."),
        isLoading: false,
      });
      throw error;
    }
  },

  updateDisplayName: async (displayName) => {
    set({ isLoading: true, error: null });
    try {
      const user = await updateDisplayNameService(displayName);
      set({ user, isLoading: false });
      return user;
    } catch (error) {
      set({
        error: getFirebaseErrorMessage(error, "Profile update failed."),
        isLoading: false,
      });
      throw error;
    }
  },

  initializeAuth: () => {
    if (unsubscribeAuth) {
      return unsubscribeAuth;
    }

    if (!isFirebaseClientConfigured()) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
      return () => {};
    }

    set({ isLoading: true });

    unsubscribeAuth = subscribeToAuthState(async (user) => {
      const userId = user?.id ?? null;
      const shouldSyncSession = lastSyncedUserId !== userId;
      lastSyncedUserId = userId;

      if (user) {
        if (shouldSyncSession) {
          const idToken = await getCurrentIdToken();
          await syncServerSession(idToken);
        }
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
        return;
      }

      if (shouldSyncSession) {
        await syncServerSession(null);
      }
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

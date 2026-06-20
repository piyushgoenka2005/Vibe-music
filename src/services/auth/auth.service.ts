"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";
import type { AppUser, SignInInput, SignUpInput } from "@/types/user";
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
} from "@/services/auth/user.service";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const SESSION_SYNC_RETRIES = 4;
const SESSION_SYNC_RETRY_MS = 450;

function assertAuthConfigured(): void {
  if (!isFirebaseClientConfigured()) {
    throw new Error(
      "Firebase Auth is not configured. Add NEXT_PUBLIC_FIREBASE_* values to .env.local and restart the dev server."
    );
  }
}

function shouldFallbackToRedirect(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const code = String((error as { code: string }).code);
  return (
    code === "auth/internal-error" ||
    code === "auth/popup-blocked" ||
    code === "auth/cancelled-popup-request"
  );
}

async function ensureUserProfile(user: FirebaseUser): Promise<void> {
  try {
    const profile = await getUserProfile(user.uid);
    if (profile) {
      if (user.photoURL && profile.photoURL !== user.photoURL) {
        await updateUserProfile(user.uid, { photoURL: user.photoURL });
      }
      return;
    }
    await createUserProfile(user.uid, {
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? undefined,
    });
  } catch {
    // Profile sync is best-effort during sign-in.
  }
}

function mapFirebaseUser(user: FirebaseUser): AppUser {
  return {
    id: user.uid,
    email: user.email ?? "",
    name: user.displayName ?? user.email ?? "User",
    photoURL: user.photoURL ?? undefined,
  };
}

export async function getCurrentIdToken(forceRefresh = false): Promise<string | null> {
  const auth = getClientAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

export function subscribeToAuthState(
  callback: (user: AppUser | null) => void
): () => void {
  assertAuthConfigured();
  const auth = getClientAuth();
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    await ensureUserProfile(firebaseUser);
    callback(mapFirebaseUser(firebaseUser));
  });
}

export async function signUp(input: SignUpInput): Promise<AppUser> {
  assertAuthConfigured();
  const auth = getClientAuth();
  const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
  const displayName = input.displayName?.trim() ?? "";
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  await createUserProfile(credential.user.uid, {
    email: input.email,
    displayName,
  });
  return mapFirebaseUser(credential.user);
}

export async function signIn(input: SignInInput): Promise<AppUser> {
  assertAuthConfigured();
  const auth = getClientAuth();
  const credential = await signInWithEmailAndPassword(auth, input.email, input.password);
  await ensureUserProfile(credential.user);
  return mapFirebaseUser(credential.user);
}

export async function signInWithGoogle(): Promise<AppUser> {
  assertAuthConfigured();
  const auth = getClientAuth();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(result.user);
    return mapFirebaseUser(result.user);
  } catch (error) {
    if (!shouldFallbackToRedirect(error)) throw error;
    await signInWithRedirect(auth, googleProvider);
    throw new Error("Redirecting to Google sign-in…");
  }
}

export async function completeGoogleRedirectSignIn(): Promise<AppUser | null> {
  if (!isFirebaseClientConfigured()) return null;
  const auth = getClientAuth();
  const result = await getRedirectResult(auth);
  if (!result?.user) return null;
  await ensureUserProfile(result.user);
  return mapFirebaseUser(result.user);
}

export async function logout(): Promise<void> {
  assertAuthConfigured();
  await signOut(getClientAuth());
}

export async function forgotPassword(email: string): Promise<void> {
  assertAuthConfigured();
  await sendPasswordResetEmail(getClientAuth(), email);
}

export async function updateDisplayName(displayName: string): Promise<AppUser> {
  assertAuthConfigured();
  const auth = getClientAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const trimmed = displayName.trim();
  await updateProfile(user, { displayName: trimmed });
  await updateUserProfile(user.uid, { displayName: trimmed });

  return mapFirebaseUser(user);
}

async function fetchSessionRoute(
  url: string,
  init: RequestInit
): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < SESSION_SYNC_RETRIES; attempt += 1) {
    const response = await fetch(url, init);
    lastResponse = response;

    if (response.status !== 404) {
      return response;
    }

    if (attempt < SESSION_SYNC_RETRIES - 1) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, SESSION_SYNC_RETRY_MS * (attempt + 1));
      });
    }
  }

  return lastResponse!;
}

export async function syncServerSession(idToken: string | null): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const requestInit: RequestInit = {
      signal: AbortSignal.timeout(8_000),
    };

    if (idToken) {
      const response = await fetchSessionRoute("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        ...requestInit,
      });

      if (!response.ok && response.status !== 404) {
        console.warn("[auth] Session cookie sync failed:", response.status);
      }
      return;
    }

    await fetchSessionRoute("/api/auth/session", {
      method: "DELETE",
      ...requestInit,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return;
    }
    console.warn("[auth] Session cookie sync skipped:", error);
  }
}

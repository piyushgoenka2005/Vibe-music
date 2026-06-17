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
      displayName:
        user.displayName ?? user.email?.split("@")[0] ?? "User",
      photoURL: user.photoURL,
    });
  } catch (error) {
    console.warn("[auth] Firestore profile sync skipped:", error);
  }
}

export function mapFirebaseUser(user: FirebaseUser): AppUser {
  return {
    id: user.uid,
    email: user.email ?? "",
    name: user.displayName ?? user.email?.split("@")[0] ?? "User",
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

export async function signUp(input: SignUpInput): Promise<AppUser> {
  assertAuthConfigured();
  const auth = getClientAuth();
  const credential = await createUserWithEmailAndPassword(
    auth,
    input.email,
    input.password
  );

  const displayName = input.displayName?.trim() || input.email.split("@")[0];

  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }

  await ensureUserProfile(credential.user);

  return mapFirebaseUser(credential.user);
}

export async function signIn(input: SignInInput): Promise<AppUser> {
  assertAuthConfigured();
  const auth = getClientAuth();
  const credential = await signInWithEmailAndPassword(
    auth,
    input.email,
    input.password
  );

  await ensureUserProfile(credential.user);

  return mapFirebaseUser(credential.user);
}

export async function signInWithGoogle(): Promise<AppUser> {
  assertAuthConfigured();
  const auth = getClientAuth();

  try {
    const credential = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(credential.user);
    return mapFirebaseUser(credential.user);
  } catch (error) {
    if (shouldFallbackToRedirect(error)) {
      await signInWithRedirect(auth, googleProvider);
      return new Promise(() => {});
    }
    throw error;
  }
}

export async function completeGoogleRedirectSignIn(): Promise<AppUser | null> {
  assertAuthConfigured();
  const auth = getClientAuth();
  const credential = await getRedirectResult(auth);
  if (!credential?.user) return null;

  await ensureUserProfile(credential.user);
  return mapFirebaseUser(credential.user);
}

export async function logout(): Promise<void> {
  await signOut(getClientAuth());
}

export async function forgotPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(getClientAuth(), email.trim());
}

export async function getCurrentIdToken(forceRefresh = false): Promise<string | null> {
  const user = getClientAuth().currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

export function subscribeToAuthState(
  listener: (user: AppUser | null) => void
): () => void {
  return onAuthStateChanged(getClientAuth(), (firebaseUser) => {
    listener(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
  });
}

export async function updateDisplayName(displayName: string): Promise<AppUser> {
  const auth = getClientAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated");
  }

  const trimmed = displayName.trim();
  await updateProfile(user, { displayName: trimmed });
  await updateUserProfile(user.uid, { displayName: trimmed });

  return mapFirebaseUser(user);
}

export async function syncServerSession(idToken: string | null): Promise<void> {
  try {
    if (idToken) {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        console.warn("[auth] Session cookie sync failed:", response.status);
      }
      return;
    }

    await fetch("/api/auth/session", { method: "DELETE" });
  } catch (error) {
    console.warn("[auth] Session cookie sync skipped:", error);
  }
}

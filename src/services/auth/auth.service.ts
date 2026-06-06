import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import type { AppUser, SignInInput, SignUpInput } from "@/types/user";
import { createUserProfile, getUserProfile } from "@/services/auth/user.service";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

async function ensureUserProfile(user: FirebaseUser): Promise<void> {
  try {
    const profile = await getUserProfile(user.uid);
    if (profile) return;

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
  const auth = getClientAuth();
  const credential = await signInWithPopup(auth, googleProvider);

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

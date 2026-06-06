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

  await createUserProfile(credential.user.uid, {
    email: credential.user.email ?? input.email,
    displayName,
    photoURL: credential.user.photoURL,
  });

  return mapFirebaseUser(credential.user);
}

export async function signIn(input: SignInInput): Promise<AppUser> {
  const auth = getClientAuth();
  const credential = await signInWithEmailAndPassword(
    auth,
    input.email,
    input.password
  );

  const profile = await getUserProfile(credential.user.uid);
  if (!profile) {
    await createUserProfile(credential.user.uid, {
      email: credential.user.email ?? input.email,
      displayName:
        credential.user.displayName ??
        credential.user.email?.split("@")[0] ??
        "User",
      photoURL: credential.user.photoURL,
    });
  }

  return mapFirebaseUser(credential.user);
}

export async function signInWithGoogle(): Promise<AppUser> {
  const auth = getClientAuth();
  const credential = await signInWithPopup(auth, googleProvider);

  const profile = await getUserProfile(credential.user.uid);
  if (!profile) {
    await createUserProfile(credential.user.uid, {
      email: credential.user.email ?? "",
      displayName:
        credential.user.displayName ??
        credential.user.email?.split("@")[0] ??
        "User",
      photoURL: credential.user.photoURL,
    });
  }

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
  if (idToken) {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    return;
  }

  await fetch("/api/auth/session", { method: "DELETE" });
}

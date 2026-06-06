import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase/client";
import type { UserProfile } from "@/types/user";

const USERS_COLLECTION = "users";

function profileDocRef(uid: string) {
  return doc(getClientFirestore(), USERS_COLLECTION, uid);
}

export async function createUserProfile(
  uid: string,
  data: Pick<UserProfile, "email" | "displayName" | "photoURL">
): Promise<UserProfile> {
  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(profileDocRef(uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(profileDocRef(uid));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<Pick<UserProfile, "displayName" | "photoURL">>
): Promise<void> {
  await updateDoc(profileDocRef(uid), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

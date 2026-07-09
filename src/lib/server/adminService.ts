import { getAdminFirestore } from "@/lib/firebase/admin";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import type { AdminProfile, AdminRole, AdminSession } from "@/types/admin";

const COLLECTION = "admins";

export async function getAdminProfile(uid: string): Promise<AdminProfile | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(uid).get();
  if (!doc.exists) return null;

  const data = doc.data();
  if (!data?.isActive) return null;

  return {
    uid: doc.id,
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? ""),
    role: data.role as AdminRole,
    isActive: Boolean(data.isActive),
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
    lastLoginAt: data.lastLoginAt ? String(data.lastLoginAt) : undefined,
  };
}

export async function getAdminSession(uid: string): Promise<AdminSession | null> {
  const profile = await getAdminProfile(uid);
  if (!profile) return null;

  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    role: profile.role,
    permissions: getPermissionsForRole(profile.role),
  };
}

export async function updateAdminLastLogin(uid: string): Promise<void> {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  await db.collection(COLLECTION).doc(uid).update({
    lastLoginAt: now,
    updatedAt: now,
  });
}

export async function createAdminProfile(
  uid: string,
  data: Pick<AdminProfile, "email" | "displayName" | "role">
): Promise<AdminProfile> {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const profile: AdminProfile = {
    uid,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(COLLECTION).doc(uid).set(profile);
  return profile;
}

export async function listAdmins(): Promise<AdminProfile[]> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTION).get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      email: String(data.email ?? ""),
      displayName: String(data.displayName ?? ""),
      role: data.role as AdminRole,
      isActive: Boolean(data.isActive),
      createdAt: String(data.createdAt ?? ""),
      updatedAt: String(data.updatedAt ?? ""),
      lastLoginAt: data.lastLoginAt ? String(data.lastLoginAt) : undefined,
    };
  });
}

export async function updateAdminProfile(
  uid: string,
  patch: Partial<Pick<AdminProfile, "displayName" | "role" | "isActive">>
): Promise<AdminProfile> {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  await db.collection(COLLECTION).doc(uid).update({
    ...patch,
    updatedAt: now,
  });
  const profile = await getAdminProfile(uid);
  if (!profile) throw new Error("Admin not found after update");
  return profile;
}

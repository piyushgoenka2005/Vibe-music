import { getPermissionsForRole } from "@/lib/auth/permissions";
import * as pg from "@/lib/server/prisma/usersRepository";
import type { AdminProfile, AdminRole, AdminSession } from "@/types/admin";

export async function getAdminProfile(uid: string): Promise<AdminProfile | null> {
  return pg.getAdminProfile(uid);
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
  await pg.updateAdminLastLoginRecord(uid);
}

export async function createAdminProfile(
  uid: string,
  data: Pick<AdminProfile, "email" | "displayName" | "role">
): Promise<AdminProfile> {
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

  return pg.createAdminProfileRecord(profile);
}

export async function listAdmins(): Promise<AdminProfile[]> {
  return pg.listAdmins();
}

export async function updateAdminProfile(
  uid: string,
  patch: Partial<Pick<AdminProfile, "displayName" | "role" | "isActive">>
): Promise<AdminProfile> {
  return pg.updateAdminProfileRecord(uid, patch);
}

export type { AdminRole };

import "server-only";

import { prisma } from "@/lib/db/prisma";
import { verifyTotpToken } from "@/lib/auth/totp";
import type { AdminRole } from "@/types/admin";

export function getAdminEmailsFromEnv(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "";
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0 && e.includes("@"));
  return new Set(emails);
}

/**
 * Single-query admin gate used during credentials authorize.
 * Avoids a second `getAdminSession` round-trip on JWT mint.
 */
export async function loadAdminLoginGate(
  uid: string,
  emailHint?: string | null,
): Promise<{
  isAdmin: boolean;
  role?: AdminRole;
  totpEnabled: boolean;
  totpSecret: string | null;
}> {
  const admin = await prisma.admin.findUnique({
    where: { uid },
    select: {
      isActive: true,
      role: true,
      totpEnabled: true,
      totpSecret: true,
    },
  });

  if (!admin?.isActive) {
    const adminEmails = getAdminEmailsFromEnv();
    if (adminEmails.size > 0) {
      let email = emailHint?.trim().toLowerCase();
      if (!email) {
        const u = await prisma.user.findUnique({ where: { id: uid }, select: { email: true } });
        email = u?.email?.toLowerCase();
      }
      if (email && adminEmails.has(email)) {
        const now = new Date().toISOString();
        const provisioned = await prisma.admin.upsert({
          where: { uid },
          create: {
            uid,
            email,
            displayName: "Super Admin",
            role: "super_admin",
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
          update: {
            email,
            role: "super_admin",
            isActive: true,
            updatedAt: now,
          },
        });
        return {
          isAdmin: true,
          role: "super_admin",
          totpEnabled: Boolean(provisioned.totpEnabled && provisioned.totpSecret),
          totpSecret: provisioned.totpSecret,
        };
      }
    }
    return { isAdmin: false, totpEnabled: false, totpSecret: null };
  }

  return {
    isAdmin: true,
    role: admin.role as AdminRole,
    totpEnabled: Boolean(admin.totpEnabled && admin.totpSecret),
    totpSecret: admin.totpSecret,
  };
}

/** Lightweight JWT claims — no permission matrix / override lookup. */
export async function getAdminJwtClaims(
  uid: string,
): Promise<{ isAdmin: boolean; role?: AdminRole }> {
  const admin = await prisma.admin.findUnique({
    where: { uid },
    select: { isActive: true, role: true },
  });
  if (admin?.isActive) {
    return { isAdmin: true, role: admin.role as AdminRole };
  }
  const adminEmails = getAdminEmailsFromEnv();
  if (adminEmails.size > 0) {
    const user = await prisma.user.findUnique({ where: { id: uid }, select: { email: true } });
    if (user?.email && adminEmails.has(user.email.toLowerCase())) {
      return { isAdmin: true, role: "super_admin" };
    }
  }
  return { isAdmin: false };
}

export async function verifyAdminTotpCode(
  secret: string,
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const result = await verifyTotpToken(secret, token);
  return result.valid;
}

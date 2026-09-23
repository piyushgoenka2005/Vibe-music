import "server-only";

import { prisma } from "@/lib/db/prisma";
import { verifyTotpToken } from "@/lib/auth/totp";
import type { AdminRole } from "@/types/admin";

/**
 * Single-query admin gate used during credentials authorize.
 * Avoids a second `getAdminSession` round-trip on JWT mint.
 */
export async function loadAdminLoginGate(uid: string): Promise<{
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
  if (!admin?.isActive) return { isAdmin: false };
  return { isAdmin: true, role: admin.role as AdminRole };
}

export async function verifyAdminTotpCode(
  secret: string,
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const result = await verifyTotpToken(secret, token);
  return result.valid;
}

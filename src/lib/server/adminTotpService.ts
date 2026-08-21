import "server-only";

import QRCode from "qrcode";
import { prisma } from "@/lib/db/prisma";
import {
  buildTotpUri,
  generateTotpSecret,
  verifyTotpToken,
} from "@/lib/auth/totp";

/**
 * Admin TOTP lifecycle. Secrets are stored only until enrollment is confirmed;
 * `totpEnabled` is the single source of truth for login enforcement.
 */

export interface TotpEnrollment {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

export async function getTotpEnabled(uid: string): Promise<boolean> {
  const row = await prisma.admin.findUnique({
    where: { uid },
    select: { totpEnabled: true },
  });
  return Boolean(row?.totpEnabled);
}

/** Does this account require a TOTP code at sign-in? Used by the login form pre-check. */
export async function totpRequiredForEmail(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  const row = await prisma.admin.findFirst({
    where: { email: normalized, isActive: true, totpEnabled: true },
    select: { uid: true },
  });
  return Boolean(row);
}

export async function beginTotpEnrollment(input: {
  uid: string;
  email: string;
}): Promise<TotpEnrollment> {
  const admin = await prisma.admin.findUnique({ where: { uid: input.uid } });
  if (!admin) throw new Error("Admin not found");
  if (admin.totpEnabled) throw new Error("Two-factor is already enabled");

  const secret = generateTotpSecret();
  const otpauthUrl = buildTotpUri({
    secret,
    accountLabel: input.email,
  });

  await prisma.admin.update({
    where: { uid: input.uid },
    data: { totpSecret: secret, totpEnabled: false },
  });

  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });
  return { secret, otpauthUrl, qrDataUrl };
}

export async function confirmTotpEnrollment(input: {
  uid: string;
  token: string;
}): Promise<{ ok: boolean }> {
  const admin = await prisma.admin.findUnique({ where: { uid: input.uid } });
  if (!admin?.totpSecret) throw new Error("Start enrollment first");
  if (admin.totpEnabled) return { ok: true };

  const { valid } = await verifyTotpToken(admin.totpSecret, input.token);
  if (!valid) throw new Error("Invalid code — check your authenticator app");

  await prisma.admin.update({
    where: { uid: input.uid },
    data: { totpEnabled: true },
  });
  return { ok: true };
}

export async function disableTotp(input: {
  uid: string;
  token: string;
}): Promise<{ ok: boolean }> {
  const admin = await prisma.admin.findUnique({ where: { uid: input.uid } });
  if (!admin?.totpSecret || !admin.totpEnabled) {
    throw new Error("Two-factor is not enabled");
  }

  // Require a live code to disable — stolen sessions cannot silently drop 2FA.
  const { valid } = await verifyTotpToken(admin.totpSecret, input.token);
  if (!valid) throw new Error("Invalid code");

  await prisma.admin.update({
    where: { uid: input.uid },
    data: { totpSecret: null, totpEnabled: false },
  });
  return { ok: true };
}

/** Called from the credentials authorize() callback after password success. */
export async function verifyAdminLoginTotp(
  uid: string,
  token: string | undefined
): Promise<boolean> {
  const admin = await prisma.admin.findUnique({
    where: { uid },
    select: { totpSecret: true, totpEnabled: true, isActive: true },
  });
  if (!admin?.totpEnabled || !admin.totpSecret) return true; // no 2FA → nothing to verify
  if (!token) return false;
  return verifyTotpToken(admin.totpSecret, token).then((r) => r.valid);
}

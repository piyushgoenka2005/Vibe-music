import "server-only";

import { encode as encodeJwt } from "@auth/core/jwt";
import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { getAuthSessionCookieName, resolveSessionMaxAgeSeconds } from "@/lib/auth/session-config";
import { logAuditEvent } from "@/lib/server/auditLog";
import { loadAdminLoginGate, verifyAdminTotpCode } from "@/lib/server/adminLoginGate";
import { updateAdminLastLogin } from "@/lib/server/adminService";
import { resolvePermissionsForRole } from "@/lib/server/rolePermissionsService";
import { findUserForCredentials } from "@/lib/server/userService";
import type { AdminSession } from "@/types/admin";

export type AdminFastLoginResult =
  | { ok: true; admin: AdminSession; maxAge: number; token: string; cookieName: string }
  | { ok: false; status: number; error: string; code?: string };

function resolveAuthSecret(): string | null {
  const fromEnv = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV !== "production") {
    return "dev-only-auth-secret-not-for-production";
  }
  return null;
}

function shouldUseSecureCookies(request: Request): boolean {
  const url = new URL(request.url);
  if (url.protocol === "https:") return true;
  return request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
}

/**
 * Single-shot admin credentials auth: password + admin gate (+ optional TOTP),
 * then mint an Auth.js-compatible JWT session cookie. Avoids the client CSRF →
 * callback → getSession waterfall.
 */
export async function authenticateAdminFastLogin(
  request: Request,
  input: { email: string; password: string; totp?: string; rememberMe?: boolean },
): Promise<AdminFastLoginResult> {
  const secret = resolveAuthSecret();
  if (!secret) {
    return { ok: false, status: 500, error: "Auth is not configured." };
  }

  const email = input.email.trim().toLowerCase();
  const user = await findUserForCredentials(email);
  if (!user || !user.isActive) {
    return { ok: false, status: 401, error: "Invalid email or password." };
  }

  // Password verify (CPU) and admin gate (DB) in parallel.
  const [passwordOk, gate] = await Promise.all([
    verifyPassword(input.password, user.passwordHash),
    loadAdminLoginGate(user.id),
  ]);

  if (!passwordOk) {
    return { ok: false, status: 401, error: "Invalid email or password." };
  }

  if (!gate.isAdmin || !gate.role) {
    return { ok: false, status: 403, error: "This account does not have admin access." };
  }

  if (gate.totpEnabled) {
    const totpRaw = input.totp?.trim() ?? "";
    if (!totpRaw) {
      return {
        ok: false,
        status: 401,
        error: "Two-factor code required.",
        code: "totp_required",
      };
    }
    const totpOk = await verifyAdminTotpCode(gate.totpSecret!, totpRaw);
    if (!totpOk) {
      return { ok: false, status: 401, error: "Invalid two-factor code." };
    }
  }

  const rememberMe = Boolean(input.rememberMe);
  const maxAge = resolveSessionMaxAgeSeconds(rememberMe);
  const nowSec = Math.floor(Date.now() / 1000);
  const secure = shouldUseSecureCookies(request);
  const cookieName = getAuthSessionCookieName(secure);

  const [permissions, token] = await Promise.all([
    resolvePermissionsForRole(gate.role),
    encodeJwt({
      token: {
        name: user.name,
        email: user.email,
        picture: user.image,
        sub: user.id,
        uid: user.id,
        isAdmin: true,
        adminRole: gate.role,
        authProvider: "credentials",
        exp: nowSec + maxAge,
      },
      secret,
      salt: cookieName,
      maxAge,
    }),
  ]);

  const displayName = user.name?.trim() || user.email.split("@")[0] || "Admin";

  const admin: AdminSession = {
    uid: user.id,
    email: user.email,
    displayName,
    role: gate.role,
    permissions,
  };

  void updateAdminLastLogin(user.id);
  void logAuditEvent({
    action: "auth.session_created",
    actorId: user.id,
    actorEmail: user.email,
    resourceType: "session",
    metadata: { provider: "credentials", via: "admin_fast_login" },
  });

  return { ok: true, admin, maxAge, token, cookieName };
}

/** Attach the Auth.js session cookie (and clear the insecure/secure twin). */
export function applyAdminSessionCookie(
  response: NextResponse,
  result: Extract<AdminFastLoginResult, { ok: true }>,
  request: Request,
): NextResponse {
  const secure = shouldUseSecureCookies(request);
  const expires = new Date(Date.now() + result.maxAge * 1000);

  response.cookies.set(result.cookieName, result.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    expires,
    maxAge: result.maxAge,
  });

  // Clear the alternate cookie name so stale twins don't confuse session reads.
  const twin = getAuthSessionCookieName(!secure);
  if (twin !== result.cookieName) {
    response.cookies.set(twin, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: !secure,
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}

import { auth } from "@/auth";

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return {
    uid: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  };
}

export async function isAuthenticatedRequest(): Promise<boolean> {
  const user = await getSessionUser();
  return user !== null;
}

/** @deprecated Auth.js manages cookies — kept for API compatibility during migration. */
export async function getSessionCookieFromStore(): Promise<string | undefined> {
  return undefined;
}

/** @deprecated Auth.js manages session cookies. */
export async function createSessionCookie(_idToken: string): Promise<string> {
  throw new Error("createSessionCookie is deprecated — use Auth.js signIn()");
}

/** @deprecated Auth.js manages session verification. */
export async function verifySessionCookie(_sessionCookie: string | undefined): Promise<boolean> {
  return isAuthenticatedRequest();
}

/** @deprecated Auth.js manages session cache. */
export function invalidateSessionCache(_sessionCookie?: string): void {
  // no-op
}

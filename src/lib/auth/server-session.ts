import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  AUTH_SESSION_COOKIE,
  AUTH_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/protected-routes";

const SESSION_CACHE_TTL_MS = 60_000;
const SESSION_CACHE_MAX_ENTRIES = 2_000;

interface CachedSession {
  user: SessionUser;
  expiresAt: number;
}

const sessionCache = new Map<string, CachedSession>();

export async function createSessionCookie(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: AUTH_SESSION_MAX_AGE_SECONDS * 1000,
  });
}

function sessionCacheKey(sessionCookie: string): string {
  return createHash("sha256").update(sessionCookie).digest("hex");
}

function trimSessionCache(): void {
  if (sessionCache.size <= SESSION_CACHE_MAX_ENTRIES) return;

  const now = Date.now();
  for (const [key, entry] of sessionCache) {
    if (entry.expiresAt <= now) {
      sessionCache.delete(key);
    }
    if (sessionCache.size <= SESSION_CACHE_MAX_ENTRIES * 0.8) break;
  }
}

export function invalidateSessionCache(sessionCookie?: string): void {
  if (sessionCookie) {
    sessionCache.delete(sessionCacheKey(sessionCookie));
    return;
  }
  sessionCache.clear();
}

export async function verifySessionCookie(
  sessionCookie: string | undefined
): Promise<boolean> {
  if (!sessionCookie) return false;

  try {
    await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return true;
  } catch {
    invalidateSessionCache(sessionCookie);
    return false;
  }
}

export async function getSessionCookieFromStore(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_SESSION_COOKIE)?.value;
}

export async function isAuthenticatedRequest(): Promise<boolean> {
  const sessionCookie = await getSessionCookieFromStore();
  return verifySessionCookie(sessionCookie);
}

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const sessionCookie = await getSessionCookieFromStore();
  if (!sessionCookie) return null;

  const cacheKey = sessionCacheKey(sessionCookie);
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const user: SessionUser = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
    };

    sessionCache.set(cacheKey, {
      user,
      expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    });
    trimSessionCache();

    return user;
  } catch {
    invalidateSessionCache(sessionCookie);
    return null;
  }
}

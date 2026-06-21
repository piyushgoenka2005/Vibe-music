export function isSessionCookiePlausible(sessionCookie: string | undefined): boolean {
  if (!sessionCookie || sessionCookie.length < 32) {
    return false;
  }

  const parts = sessionCookie.split(".");
  if (parts.length !== 3) {
    return false;
  }

  try {
    const payloadSegment = parts[1]!;
    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

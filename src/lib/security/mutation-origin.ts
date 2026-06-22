function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

function buildAllowedOrigins(): Set<string> {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    "https://vibemusic.in",
    "https://www.vibemusic.in",
    process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined,
    process.env.NODE_ENV !== "production" ? "http://127.0.0.1:3000" : undefined,
  ];

  return new Set(
    candidates
      .filter(Boolean)
      .map((value) => normalizeOrigin(value as string))
  );
}

const ALLOWED_ORIGINS = buildAllowedOrigins();

function isTrustedOrigin(candidate: string, requestOrigin: string): boolean {
  const normalized = normalizeOrigin(candidate);
  if (normalized === requestOrigin) return true;
  if (ALLOWED_ORIGINS.has(normalized)) return true;

  // Vercel preview/production aliases (*.vercel.app)
  try {
    const host = new URL(normalized).hostname;
    if (host.endsWith(".vercel.app")) return true;
  } catch {
    // ignore malformed origins
  }

  return false;
}

export function verifyMutationOrigin(request: Request): boolean {
  const requestOrigin = normalizeOrigin(request.url);

  const origin = request.headers.get("origin");
  if (origin) {
    return isTrustedOrigin(origin, requestOrigin);
  }

  const referer = request.headers.get("referer");
  if (referer) {
    return isTrustedOrigin(referer, requestOrigin);
  }

  // Same-host POST without Origin/Referer (some browsers/extensions)
  return process.env.NODE_ENV !== "production";
}

export function isWebhookPath(pathname: string): boolean {
  return pathname.startsWith("/api/payment/webhook");
}

export function isMutationMethod(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

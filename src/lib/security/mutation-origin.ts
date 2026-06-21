const ALLOWED_ORIGINS = new Set(
  [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    "https://vibemusic.in",
    process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined,
    process.env.NODE_ENV !== "production" ? "http://127.0.0.1:3000" : undefined,
  ].filter(Boolean) as string[]
);

function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

export function verifyMutationOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    return ALLOWED_ORIGINS.has(normalizeOrigin(origin));
  }

  const referer = request.headers.get("referer");
  if (referer) {
    return ALLOWED_ORIGINS.has(normalizeOrigin(referer));
  }

  return process.env.NODE_ENV !== "production";
}

export function isWebhookPath(pathname: string): boolean {
  return pathname.startsWith("/api/payment/webhook");
}

export function isMutationMethod(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

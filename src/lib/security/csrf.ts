import "server-only";

import { SITE_URL } from "@/lib/site";

const ALLOWED_ORIGINS = new Set(
  [
    SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined,
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

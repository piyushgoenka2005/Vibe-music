import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceMutationSecurity, enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { reportServerError } from "@/lib/server/errorMonitoring";

export const dynamic = "force-dynamic";

const clientErrorSchema = z.object({
  message: z.string().min(1).max(500),
  digest: z.string().max(128).optional(),
  stack: z.string().max(2000).optional(),
  url: z.string().max(500).optional(),
  boundary: z.enum(["route", "global"]).optional(),
});

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, "client-error", RATE_LIMITS.publicApi);
  if (rateLimited) return rateLimited;

  const csrfError = enforceMutationSecurity(request);
  if (csrfError) return csrfError;

  try {
    const raw = await request.json();
    const parsed = clientErrorSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { message, digest, stack, url, boundary } = parsed.data;
    const error = new Error(message);
    if (stack) error.stack = stack;

    reportServerError(error, {
      source: `client:${boundary ?? "route"}`,
      routePath: url,
      meta: digest ? { digest } : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

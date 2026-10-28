import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, parseJsonBody } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { logInfo } from "@/lib/server/logger";
import { publicApiError } from "@/lib/server/publicApiError";

const vitalsSchema = z
  .object({
    name: z.string(),
    value: z.number(),
    rating: z.string().optional(),
    id: z.string().optional(),
    navigationType: z.string().optional(),
    path: z.string().optional(),
  })
  .passthrough();

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "web-vitals", RATE_LIMITS.analytics);
    if (rateLimited) return NextResponse.json({ ok: true, throttled: true });

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      const text = await request.text().catch(() => "");
      try {
        rawBody = text ? JSON.parse(text) : {};
      } catch {
        return NextResponse.json({ ok: true, ignored: true });
      }
    }

    const parsed = vitalsSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const metric = parsed.data;
    logInfo(
      `[web-vitals] ${metric.name}=${metric.value} rating=${metric.rating ?? "n/a"} path=${metric.path ?? "n/a"}`,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return publicApiError(error, "Failed to record vitals");
  }
}

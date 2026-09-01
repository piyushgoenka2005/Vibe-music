import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, parseJsonBody } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { logInfo } from "@/lib/server/logger";
import { publicApiError } from "@/lib/server/publicApiError";

const vitalsSchema = z.object({
  name: z.string(),
  value: z.number(),
  rating: z.string().optional(),
  id: z.string().optional(),
  navigationType: z.string().optional(),
  path: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "web-vitals", RATE_LIMITS.publicApi);
    if (rateLimited) return rateLimited;

    const parsed = await parseJsonBody(request, vitalsSchema);
    if ("error" in parsed) return parsed.error;

    const metric = parsed.data;
    logInfo(`[web-vitals] ${metric.name}=${metric.value} rating=${metric.rating ?? "n/a"} path=${metric.path ?? "n/a"}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return publicApiError(error, "Failed to record vitals");
  }
}

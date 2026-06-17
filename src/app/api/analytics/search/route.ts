import { z } from "zod";
import { NextResponse } from "next/server";
import { recordSearchAnalyticsEvent } from "@/lib/server/searchAnalyticsService";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  handleRouteError,
  parseJsonBody,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const searchAnalyticsSchema = z
  .object({
    eventType: z.enum(["search", "click"]),
    query: z.string().min(2).max(200),
    resultsCount: z.number().int().min(0).optional().nullable(),
    clickedProductId: z.string().min(1).max(128).optional().nullable(),
    clickedProductSlug: z.string().min(1).max(255).optional().nullable(),
    clickedProductName: z.string().min(1).max(255).optional().nullable(),
    source: z.enum(["autocomplete", "results-page", "submit"]),
  })
  .superRefine((value, ctx) => {
    if (value.eventType === "click") {
      if (!value.clickedProductId || !value.clickedProductSlug) {
        ctx.addIssue({
          code: "custom",
          message: "Click events require product id and slug",
          path: ["clickedProductId"],
        });
      }
    }
  });

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "analytics-search",
      RATE_LIMITS.analytics
    );
    if (rateLimited) return rateLimited;

    const csrfBlocked = enforceMutationSecurity(request);
    if (csrfBlocked) return csrfBlocked;

    const parsed = await parseJsonBody(request, searchAnalyticsSchema);
    if ("error" in parsed) return parsed.error;

    const event = await recordSearchAnalyticsEvent(parsed.data);
    return NextResponse.json({ ok: true, id: event.id }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "api/analytics/search");
  }
}

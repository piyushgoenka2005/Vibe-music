import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  handleRouteError,
  jsonError,
} from "@/lib/api/route-utils";
import { voteReviewHelpful } from "@/lib/server/reviewVoteService";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const rateLimited = await enforceRateLimit(request, "review-vote", {
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (rateLimited) return rateLimited;

    const csrf = enforceMutationSecurity(request);
    if (csrf) return csrf;

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return jsonError("Authentication required", 401);
    }

    const { id } = await context.params;
    const result = await voteReviewHelpful(id, sessionUser.uid);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to vote";
    if (message.includes("already marked")) {
      return jsonError(message, 409);
    }
    if (message.includes("not found")) {
      return jsonError(message, 404);
    }
    return handleRouteError(error, "POST /api/reviews/[id]/vote");
  }
}

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { createFinanceApplicationSchema } from "@/lib/validations/finance";
import { submitFinanceApplication } from "@/lib/server/financeApplicationService";
import { enforceMutationSecurity, enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "finance-apply", RATE_LIMITS.checkout);
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const [sessionUser, body] = await Promise.all([
      getSessionUser(),
      request.json(),
    ]);
    const parsed = createFinanceApplicationSchema.parse(body);
    const application = await submitFinanceApplication(parsed, sessionUser?.uid);
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Application failed" },
      { status: 400 }
    );
  }
}

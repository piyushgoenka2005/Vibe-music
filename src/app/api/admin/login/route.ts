import { NextResponse } from "next/server";
import { z } from "zod";
import { applyAdminSessionCookie, authenticateAdminFastLogin } from "@/lib/server/adminFastLogin";
import { emailSchema } from "@/lib/validations/auth";
import { enforceMutationSecurity, enforceRateLimit, handleRouteError } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const adminLoginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
  totp: z.string().max(12).optional(),
  rememberMe: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "admin-login", RATE_LIMITS.auth);
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const body = (await request.json()) as unknown;
    const parsed = adminLoginBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid login details." },
        { status: 400 },
      );
    }

    const result = await authenticateAdminFastLogin(request, parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          ...(result.code ? { code: result.code } : {}),
        },
        { status: result.status },
      );
    }

    const response = NextResponse.json({ ok: true, admin: result.admin });
    return applyAdminSessionCookie(response, result, request);
  } catch (error) {
    return handleRouteError(error, "admin-login", request);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { displayNameSchema } from "@/lib/validations/auth";
import { updateUserDisplayName } from "@/lib/server/userService";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  handleRouteError,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const profileSchema = z.object({
  displayName: displayNameSchema,
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await enforceRateLimit(request, "account-profile", RATE_LIMITS.publicApi);
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const body = (await request.json()) as unknown;
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await updateUserDisplayName(session.user.id, parsed.data.displayName);

    return NextResponse.json({
      ok: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: parsed.data.displayName,
      },
    });
  } catch (error) {
    return handleRouteError(error, "api/account/profile PATCH", request);
  }
}

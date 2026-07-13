import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { displayNameSchema } from "@/lib/validations/auth";
import {
  findUserById,
  updateUserProfile,
} from "@/lib/server/userService";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  handleRouteError,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const profileSchema = z.object({
  displayName: displayNameSchema.optional(),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^$|^\+?[\d\s-]{8,20}$/, "Enter a valid phone number")
    .optional(),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^$|^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
    .optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await findUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? "",
        dateOfBirth: user.dateOfBirth ?? "",
      },
    });
  } catch (error) {
    return handleRouteError(error, "api/account/profile GET");
  }
}

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

    if (
      parsed.data.displayName == null &&
      parsed.data.phone == null &&
      parsed.data.dateOfBirth == null
    ) {
      return NextResponse.json({ error: "No profile fields to update" }, { status: 400 });
    }

    const updated = await updateUserProfile(session.user.id, {
      displayName: parsed.data.displayName,
      phone: parsed.data.phone,
      dateOfBirth: parsed.data.dateOfBirth,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: updated.name,
        phone: updated.phone ?? "",
        dateOfBirth: updated.dateOfBirth ?? "",
      },
    });
  } catch (error) {
    return handleRouteError(error, "api/account/profile PATCH", request);
  }
}

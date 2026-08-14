import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  isPrismaUnavailableError,
  SERVICE_UNAVAILABLE_MESSAGE,
} from "@/lib/db/prisma-errors";
import { hashPasswordResetToken } from "@/lib/auth/password-reset-token";
import { findUserByEmail, updateUserPassword } from "@/lib/server/userService";
import { passwordSchema } from "@/lib/validations/auth";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  handleRouteError,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: passwordSchema,
});

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "auth-reset-password",
      RATE_LIMITS.auth
    );
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    const body = (await request.json()) as unknown;
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    let user;
    try {
      user = await findUserByEmail(email);
    } catch (error) {
      if (isPrismaUnavailableError(error)) {
        return NextResponse.json(
          { error: SERVICE_UNAVAILABLE_MESSAGE },
          { status: 503 }
        );
      }
      throw error;
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    const tokenHash = hashPasswordResetToken(parsed.data.token);
    let verification;
    try {
      verification = await prisma.verificationToken.findFirst({
        where: {
          identifier: email,
          token: tokenHash,
          expires: { gt: new Date() },
        },
      });
    } catch (error) {
      if (isPrismaUnavailableError(error)) {
        return NextResponse.json(
          { error: SERVICE_UNAVAILABLE_MESSAGE },
          { status: 503 }
        );
      }
      throw error;
    }

    if (!verification) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    await updateUserPassword(user.id, parsed.data.password);
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isPrismaUnavailableError(error)) {
      return NextResponse.json(
        { error: SERVICE_UNAVAILABLE_MESSAGE },
        { status: 503 }
      );
    }
    return handleRouteError(error, "api/auth/reset-password POST", request);
  }
}

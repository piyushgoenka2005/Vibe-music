import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isSmtpConfigured } from "@/lib/server/email/smtp";
import { sendPasswordResetEmail } from "@/lib/server/passwordResetEmailService";
import { findUserByEmail } from "@/lib/server/userService";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  handleRouteError,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const UNAVAILABLE_MESSAGE =
  "Password reset email is temporarily unavailable. Please try again later or contact support.";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "auth-forgot-password",
      RATE_LIMITS.auth
    );
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

    // Fail closed before looking up the user so we never pretend an email was sent.
    if (!isSmtpConfigured()) {
      return NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 503 });
    }

    const body = (await request.json()) as unknown;
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid email" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await findUserByEmail(email);

    // Always return success when the account is unknown to avoid email enumeration.
    if (user?.passwordHash) {
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await prisma.verificationToken.deleteMany({ where: { identifier: email } });
      await prisma.verificationToken.create({
        data: { identifier: email, token, expires },
      });

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim();
      if (!siteUrl) {
        throw new Error(
          "NEXT_PUBLIC_SITE_URL is required to send password reset emails."
        );
      }
      const resetUrl = `${siteUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      const sent = await sendPasswordResetEmail(email, resetUrl);
      if (!sent) {
        await prisma.verificationToken.deleteMany({ where: { identifier: email, token } });
        return NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 503 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "api/auth/forgot-password POST", request);
  }
}

import { NextResponse } from "next/server";
import { ZodError } from "zod";

const INTERNAL_PATTERN =
  /prisma|ECONN|DATABASE_URL|stack|ENOENT|EACCES|secret|password|sql\s|aggregate|invocation/i;

function isSafeClientMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 160) return false;
  if (INTERNAL_PATTERN.test(trimmed)) return false;
  return true;
}

/**
 * Safe client-facing API errors. Never echo raw internal Error.message unless
 * it looks like a short domain validation message (not Prisma/infra).
 */
export function publicApiError(
  error: unknown,
  fallback = "Unable to complete request",
  status = 500
): NextResponse {
  if (error instanceof ZodError) {
    const message = error.issues[0]?.message?.trim() || "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    const statusCode = (error as { status: number }).status;
    const message = (error as { message: string }).message;
    if (statusCode >= 400 && statusCode < 500 && isSafeClientMessage(message)) {
      return NextResponse.json({ error: message }, { status: statusCode });
    }
  }

  if (error instanceof Error && isSafeClientMessage(error.message)) {
    // Likely a deliberate domain Error("…") from a service layer.
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error("[api]", error);
  return NextResponse.json({ error: fallback }, { status });
}

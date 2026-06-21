import "server-only";

import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth/server-session";

export class SessionAuthError extends Error {
  constructor(
    message = "Authentication required",
    public status: 401 | 403 = 401
  ) {
    super(message);
    this.name = "SessionAuthError";
  }
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new SessionAuthError();
  }
  return user;
}

export function sessionErrorResponse(error: unknown): NextResponse {
  if (error instanceof SessionAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}

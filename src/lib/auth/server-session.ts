import { cache } from "react";
import { auth } from "@/auth";

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
}

/** Per-request dedupe — admin APIs call this many times in one RSC/route. */
export const getSessionUser = cache(async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return {
    uid: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  };
});

export async function isAuthenticatedRequest(): Promise<boolean> {
  const user = await getSessionUser();
  return user !== null;
}

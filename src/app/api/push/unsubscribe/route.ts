import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { removeSubscription } from "@/lib/server/pushService";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { endpoint?: string };
  if (!body.endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  await removeSubscription(sessionUser.uid, body.endpoint);
  return NextResponse.json({ ok: true });
}

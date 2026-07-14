import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { listGiveawayEntriesForUser } from "@/lib/server/giveawayRepository";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const entries = await listGiveawayEntriesForUser(user.uid);
  return NextResponse.json({ entries });
}

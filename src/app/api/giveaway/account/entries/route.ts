import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { listGiveawayEntriesForUser } from "@/lib/server/giveawayRepository";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const entries = await listGiveawayEntriesForUser(user.uid);
    return NextResponse.json({ entries });
  } catch (error) {
    return publicApiError(error, "Failed to load entries");
  }
}

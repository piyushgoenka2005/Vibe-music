import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { getGiveawayEntryById, getGiveawayEntryByTrackingToken } from "@/lib/server/giveawayRepository";
import { publicApiError } from "@/lib/server/publicApiError";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const trackingToken = searchParams.get("trackingToken");

    const entry = trackingToken
      ? await getGiveawayEntryByTrackingToken(trackingToken)
      : await getGiveawayEntryById(id);

    if (!entry || entry.id !== id) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const sessionUser = await getSessionUser();
    const isOwner =
      (sessionUser?.uid && entry.userId === sessionUser.uid) ||
      trackingToken === entry.trackingToken;

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    return publicApiError(error, "Failed to load entry");
  }
}

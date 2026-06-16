import { NextResponse } from "next/server";
import { listReels } from "@/lib/server/gearStoryService";

export async function GET() {
  try {
    const data = await listReels();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load gear stories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

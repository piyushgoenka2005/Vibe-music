import { NextResponse } from "next/server";
import { loadSharedCompare } from "@/lib/server/compareService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const share = await loadSharedCompare(token);
    return NextResponse.json({ share });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Not found" },
      { status: 404 }
    );
  }
}

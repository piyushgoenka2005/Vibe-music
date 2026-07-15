import { NextResponse } from "next/server";
import { loadSharedWishlist } from "@/lib/server/wishlistShareService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const share = await loadSharedWishlist(token);
    return NextResponse.json({ share });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Not found" },
      { status: 404 }
    );
  }
}

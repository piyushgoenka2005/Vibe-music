import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listAllRentalBookingsPage } from "@/lib/server/rentalRepository";

export async function GET(request: Request) {
  try {
    await requireAdmin("rentals:read");
    const { searchParams } = new URL(request.url);
    const page = await listAllRentalBookingsPage({
      status: searchParams.get("status") ?? undefined,
      limit: Number(searchParams.get("limit") ?? 20),
      afterCreatedAt: searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json({
      bookings: page.bookings,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      total: page.total,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

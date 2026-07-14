import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listAllRentalBookings } from "@/lib/server/rentalRepository";

export async function GET(request: Request) {
  try {
    await requireAdmin("rentals:read");
    const { searchParams } = new URL(request.url);
    const bookings = await listAllRentalBookings({
      status: searchParams.get("status") ?? undefined,
      limit: Number(searchParams.get("limit") ?? 100),
    });
    return NextResponse.json({ bookings });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

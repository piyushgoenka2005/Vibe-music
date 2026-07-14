import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { listRentalBookingsForUser } from "@/lib/server/rentalRepository";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const bookings = await listRentalBookingsForUser(user.uid);
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load bookings" },
      { status: 500 }
    );
  }
}

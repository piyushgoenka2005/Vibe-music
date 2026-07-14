import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getRentalAnalyticsSummary } from "@/lib/server/rentalRepository";

export async function GET() {
  try {
    await requireAdmin("rentals:read");
    const analytics = await getRentalAnalyticsSummary();
    return NextResponse.json({ analytics });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

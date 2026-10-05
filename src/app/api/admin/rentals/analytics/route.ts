import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getRentalAnalyticsSummary } from "@/lib/server/rentalRepository";

export async function GET(request: Request) {
  try {
    await requireAdmin("rentals:read");
    const period = new URL(request.url).searchParams.get("period") ?? "30d";
    const analytics = await getRentalAnalyticsSummary(period);
    return NextResponse.json({ analytics });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

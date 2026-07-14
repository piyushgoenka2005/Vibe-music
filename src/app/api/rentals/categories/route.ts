import { NextResponse } from "next/server";
import { listRentalCategories } from "@/lib/server/rentalRepository";

export async function GET() {
  try {
    const categories = await listRentalCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load categories" },
      { status: 500 }
    );
  }
}

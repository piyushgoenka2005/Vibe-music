import { NextResponse } from "next/server";
import { getRentalPolicy } from "@/lib/server/rentalRepository";

export async function GET() {
  try {
    const policy = await getRentalPolicy();
    return NextResponse.json({ policy });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load policy" },
      { status: 500 }
    );
  }
}

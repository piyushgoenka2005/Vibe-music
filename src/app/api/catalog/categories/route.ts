import { NextResponse } from "next/server";
import { getCategories } from "@/services/catalogService";

export async function GET() {
  try {
    return NextResponse.json({ categories: await getCategories() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

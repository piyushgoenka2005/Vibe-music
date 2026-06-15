import { NextResponse } from "next/server";
import { getPublicHomepageData } from "@/lib/server/homepageService";

export async function GET() {
  const data = await getPublicHomepageData();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=45, stale-while-revalidate=120",
    },
  });
}

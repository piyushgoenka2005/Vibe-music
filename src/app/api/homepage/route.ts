import { NextResponse } from "next/server";
import { getCachedPublicHomepageData } from "@/lib/server/homepageSnapshotCache";

export async function GET() {
  const data = await getCachedPublicHomepageData();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180",
    },
  });
}

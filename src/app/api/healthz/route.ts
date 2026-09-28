import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Liveness probe — process is up (no dependency checks). */
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

import { NextResponse } from "next/server";
import { isShuttingDown } from "@/lib/server/gracefulShutdown";
import { verifyPostgresConnection } from "@/lib/server/postgresHealth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Readiness probe — DB reachable and not draining for deploy. */
export async function GET() {
  if (isShuttingDown()) {
    return NextResponse.json({ status: "draining", ready: false }, { status: 503 });
  }

  const database = await verifyPostgresConnection();
  if (!database.ok) {
    return NextResponse.json({ status: "not_ready", ready: false, database }, { status: 503 });
  }

  return NextResponse.json({ status: "ready", ready: true }, { status: 200 });
}

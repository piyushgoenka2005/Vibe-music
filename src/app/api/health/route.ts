import { NextResponse } from "next/server";
import { getIntegrationChecks } from "@/lib/server/integrationConfig";
import { verifyFirestoreConnection } from "@/lib/server/firestoreHealth";
import { logInfo } from "@/lib/server/logger";

export async function GET() {
  const timestamp = new Date().toISOString();
  const integrations = getIntegrationChecks();
  const firestoreHealth = await verifyFirestoreConnection();

  const checks: Record<string, "ok" | "error"> = {
    app: "ok",
    firestore: firestoreHealth.ok ? "ok" : "error",
  };

  const healthy = Object.values(checks).every((value) => value === "ok");
  const body = {
    status: healthy ? "healthy" : "degraded",
    timestamp,
    checks,
    integrations,
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
  };

  logInfo("Health check", "api/health", body);

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}

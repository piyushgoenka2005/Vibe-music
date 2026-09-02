import { NextResponse } from "next/server";

import { getPaymentDiagnostics } from "@/lib/server/paymentDiagnostics";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const diagnostics = await getPaymentDiagnostics();

    return NextResponse.json({
      razorpayConfigured: diagnostics.razorpayConfigured,
      databaseConfigured: diagnostics.databaseConfigured,
      databaseConnected: diagnostics.databaseConnected,
      checks: diagnostics.checks,
      databaseError: diagnostics.databaseError,
      timestamp: diagnostics.timestamp,
      environment: diagnostics.environment,
    });
  } catch (error) {
    console.error("[api/debug/payment] Error:", error);
    return NextResponse.json({ error: "Failed to get payment diagnostics" }, { status: 500 });
  }
}

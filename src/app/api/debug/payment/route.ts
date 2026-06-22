import { NextResponse } from "next/server";
import { getPaymentDiagnostics } from "@/lib/server/paymentDiagnostics";

export async function GET() {
  const diagnostics = await getPaymentDiagnostics();

  return NextResponse.json({
    razorpayConfigured: diagnostics.razorpayConfigured,
    firebaseConfigured: diagnostics.firebaseConfigured,
    firestoreConnected: diagnostics.firestoreConnected,
    checks: diagnostics.checks,
    firestoreError: diagnostics.firestoreError,
    timestamp: diagnostics.timestamp,
    environment: diagnostics.environment,
  });
}

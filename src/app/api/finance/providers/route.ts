import { NextResponse } from "next/server";
import { listFinanceProviders } from "@/lib/server/financeRepository";

export async function GET() {
  try {
    const providers = await listFinanceProviders();
    return NextResponse.json({ providers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load providers" },
      { status: 500 }
    );
  }
}

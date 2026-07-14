import { NextResponse } from "next/server";
import { listFinancePlans } from "@/lib/server/financeRepository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const plans = await listFinancePlans({
      providerId: searchParams.get("providerId") ?? undefined,
      providerSlug: searchParams.get("provider") ?? undefined,
      emiType: searchParams.get("emiType") ?? undefined,
    });
    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load plans" },
      { status: 500 }
    );
  }
}

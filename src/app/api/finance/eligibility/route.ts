import { NextResponse } from "next/server";
import { financeEligibilitySchema, financeCompareSchema } from "@/lib/validations/finance";
import {
  checkFinanceEligibility,
  listComparisonsForOrder,
} from "@/lib/server/financeApplicationService";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.compare) {
      const parsed = financeCompareSchema.parse(body);
      const comparisons = await listComparisonsForOrder(parsed);
      return NextResponse.json({ comparisons });
    }

    const parsed = financeEligibilitySchema.parse(body);
    const result = await checkFinanceEligibility(parsed);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Eligibility check failed" },
      { status: 400 }
    );
  }
}

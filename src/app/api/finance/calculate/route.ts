import { NextResponse } from "next/server";
import { emiCalculateSchema } from "@/lib/validations/finance";
import {
  calculateFinanceEmi,
} from "@/lib/server/financeApplicationService";
import {
  getFinancePlanById,
  getFinanceProviderById,
} from "@/lib/server/financeRepository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = emiCalculateSchema.parse(body);

    if (parsed.planId) {
      const plan = await getFinancePlanById(parsed.planId);
      if (!plan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }
      const provider = await getFinanceProviderById(plan.providerId);
      const calculation = await calculateFinanceEmi({
        orderValue: parsed.orderValue,
        downPayment: parsed.downPayment,
        tenureMonths: plan.tenureMonths,
        interestRateAnnual: plan.interestRateAnnual,
        isNoCostEmi: plan.isNoCostEmi,
        processingFeePct: provider?.processingFeePct,
      });
      return NextResponse.json({ calculation, plan, provider });
    }

    const calculation = await calculateFinanceEmi({
      orderValue: parsed.orderValue,
      downPayment: parsed.downPayment,
      tenureMonths: parsed.tenureMonths,
      interestRateAnnual: parsed.interestRateAnnual ?? 0,
      isNoCostEmi: parsed.isNoCostEmi,
      processingFeePct: parsed.processingFeePct,
    });
    return NextResponse.json({ calculation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Calculation failed" },
      { status: 400 }
    );
  }
}

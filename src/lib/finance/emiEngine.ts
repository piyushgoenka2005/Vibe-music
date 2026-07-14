import type { EmiCalculationInput, EmiCalculationResult } from "@/types/finance";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Standard reducing-balance EMI (monthly). */
export function calculateEmi(input: EmiCalculationInput): EmiCalculationResult {
  const orderValue = Math.max(0, input.orderValue);
  const downPayment = Math.max(0, Math.min(input.downPayment ?? 0, orderValue));
  const principal = round2(orderValue - downPayment);
  const tenureMonths = Math.max(1, Math.floor(input.tenureMonths));
  const processingFeePct = input.processingFeePct ?? 0;
  const processingFee = round2((orderValue * processingFeePct) / 100);

  if (principal <= 0) {
    return {
      orderValue,
      downPayment,
      principal: 0,
      tenureMonths,
      interestRateAnnual: input.interestRateAnnual,
      isNoCostEmi: Boolean(input.isNoCostEmi),
      monthlyInstallment: 0,
      totalInterest: 0,
      processingFee,
      totalPayable: round2(downPayment + processingFee),
    };
  }

  if (input.isNoCostEmi || input.interestRateAnnual <= 0) {
    const monthlyInstallment = round2(principal / tenureMonths);
    return {
      orderValue,
      downPayment,
      principal,
      tenureMonths,
      interestRateAnnual: 0,
      isNoCostEmi: true,
      monthlyInstallment,
      totalInterest: 0,
      processingFee,
      totalPayable: round2(downPayment + principal + processingFee),
    };
  }

  const monthlyRate = input.interestRateAnnual / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const monthlyInstallment = round2(
    (principal * monthlyRate * factor) / (factor - 1)
  );
  const totalInterest = round2(monthlyInstallment * tenureMonths - principal);

  return {
    orderValue,
    downPayment,
    principal,
    tenureMonths,
    interestRateAnnual: input.interestRateAnnual,
    isNoCostEmi: false,
    monthlyInstallment,
    totalInterest,
    processingFee,
    totalPayable: round2(
      downPayment + monthlyInstallment * tenureMonths + processingFee
    ),
  };
}

export function compareEmiPlans(
  orderValue: number,
  downPayment: number,
  plans: Array<{
    id: string;
    name: string;
    tenureMonths: number;
    interestRateAnnual: number;
    isNoCostEmi: boolean;
    processingFeePct?: number;
  }>
): Array<EmiCalculationResult & { planId: string; planName: string }> {
  return plans.map((plan) => ({
    planId: plan.id,
    planName: plan.name,
    ...calculateEmi({
      orderValue,
      downPayment,
      tenureMonths: plan.tenureMonths,
      interestRateAnnual: plan.interestRateAnnual,
      isNoCostEmi: plan.isNoCostEmi,
      processingFeePct: plan.processingFeePct,
    }),
  }));
}

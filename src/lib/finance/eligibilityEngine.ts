import { calculateEmi } from "@/lib/finance/emiEngine";
import type {
  FinanceEligibilityInput,
  FinanceEligibilityResult,
  FinancePlan,
  FinanceProvider,
} from "@/types/finance";

const MIN_MONTHLY_INCOME_RATIO = 3;

export function evaluateFinanceEligibility(input: {
  plan: FinancePlan;
  provider: FinanceProvider;
  eligibility: FinanceEligibilityInput;
}): FinanceEligibilityResult {
  const reasons: string[] = [];
  const { plan, provider, eligibility } = input;
  const orderValue = eligibility.orderValue;
  const downPayment = eligibility.downPayment ?? 0;
  const minDown = (orderValue * plan.downPaymentMinPct) / 100;

  if (orderValue < plan.minOrderValue || orderValue < provider.minOrderValue) {
    reasons.push(
      `Minimum order value is ₹${Math.max(plan.minOrderValue, provider.minOrderValue)}`
    );
  }
  if (orderValue > plan.maxOrderValue || orderValue > provider.maxOrderValue) {
    reasons.push(
      `Maximum order value is ₹${Math.min(plan.maxOrderValue, provider.maxOrderValue)}`
    );
  }
  if (downPayment < minDown) {
    reasons.push(`Minimum down payment is ₹${Math.round(minDown)} (${plan.downPaymentMinPct}%)`);
  }
  if (eligibility.emiType && plan.emiType !== eligibility.emiType) {
    reasons.push(`Selected plan does not support ${eligibility.emiType} EMI`);
  }
  if (plan.status !== "active" || provider.status !== "active") {
    reasons.push("Finance plan or provider is not active");
  }

  const calculation = calculateEmi({
    orderValue,
    downPayment,
    tenureMonths: plan.tenureMonths,
    interestRateAnnual: plan.interestRateAnnual,
    isNoCostEmi: plan.isNoCostEmi,
    processingFeePct: provider.processingFeePct,
  });

  if (
    eligibility.monthlyIncome &&
    eligibility.monthlyIncome < calculation.monthlyInstallment * MIN_MONTHLY_INCOME_RATIO
  ) {
    reasons.push(
      "Monthly income should be at least 3× the EMI for eligibility"
    );
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    plan,
    provider,
    calculation,
  };
}

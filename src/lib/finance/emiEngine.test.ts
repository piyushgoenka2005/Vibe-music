import { describe, expect, it } from "vitest";
import { calculateEmi } from "@/lib/finance/emiEngine";
import { evaluateFinanceEligibility } from "@/lib/finance/eligibilityEngine";
import type { FinancePlan, FinanceProvider } from "@/types/finance";

const provider: FinanceProvider = {
  id: "p1",
  name: "Test Bank",
  slug: "test",
  type: "bank",
  description: "",
  status: "active",
  minOrderValue: 5000,
  maxOrderValue: 200000,
  processingFeePct: 1,
  sortOrder: 0,
  createdAt: "",
  updatedAt: "",
};

const plan: FinancePlan = {
  id: "plan1",
  providerId: "p1",
  name: "6 month",
  tenureMonths: 6,
  interestRateAnnual: 0,
  isNoCostEmi: true,
  emiType: "card",
  minOrderValue: 5000,
  maxOrderValue: 200000,
  downPaymentMinPct: 0,
  status: "active",
  createdAt: "",
  updatedAt: "",
};

describe("emiEngine", () => {
  it("calculates no-cost EMI evenly", () => {
    const result = calculateEmi({
      orderValue: 12000,
      tenureMonths: 6,
      interestRateAnnual: 0,
      isNoCostEmi: true,
    });
    expect(result.monthlyInstallment).toBe(2000);
    expect(result.totalInterest).toBe(0);
  });

  it("calculates interest-bearing EMI", () => {
    const result = calculateEmi({
      orderValue: 60000,
      tenureMonths: 12,
      interestRateAnnual: 12,
      isNoCostEmi: false,
    });
    expect(result.monthlyInstallment).toBeGreaterThan(5000);
    expect(result.totalInterest).toBeGreaterThan(0);
  });

  it("includes down payment in total", () => {
    const result = calculateEmi({
      orderValue: 50000,
      downPayment: 10000,
      tenureMonths: 6,
      interestRateAnnual: 0,
      isNoCostEmi: true,
    });
    expect(result.principal).toBe(40000);
    expect(result.totalPayable).toBe(50000);
  });
});

describe("eligibilityEngine", () => {
  it("approves eligible order", () => {
    const result = evaluateFinanceEligibility({
      plan,
      provider,
      eligibility: { orderValue: 25000, planId: plan.id },
    });
    expect(result.eligible).toBe(true);
    expect(result.calculation?.monthlyInstallment).toBeGreaterThan(0);
  });

  it("rejects below minimum order value", () => {
    const result = evaluateFinanceEligibility({
      plan,
      provider,
      eligibility: { orderValue: 1000, planId: plan.id },
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

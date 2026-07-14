"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import type { FinancePlan, FinanceProvider } from "@/types/finance";

export default function FinancingHubPage() {
  const [orderValue, setOrderValue] = useState(25000);
  const [downPayment, setDownPayment] = useState(0);
  const [emiType, setEmiType] = useState<string>("");

  const { data: providersData } = useQuery({
    queryKey: ["finance-providers"],
    queryFn: async () => {
      const res = await fetch("/api/finance/providers");
      return res.json() as Promise<{ providers: FinanceProvider[] }>;
    },
  });

  const compareMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/finance/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compare: true,
          orderValue,
          downPayment,
          emiType: emiType || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Compare failed");
      return json.comparisons as Array<{
        plan: FinancePlan;
        provider: FinanceProvider;
        eligible: boolean;
        reasons: string[];
        calculation: {
          monthlyInstallment: number;
          totalPayable: number;
          totalInterest: number;
          isNoCostEmi: boolean;
        };
      }>;
    },
  });

  const providers = providersData?.providers ?? [];

  return (
    <main className="storefront-page finance-page">
      <header>
        <p className="rentals-hero__eyebrow">Financing</p>
        <h1 className="rentals-hero__title">EMI calculator & finance applications</h1>
        <p className="rentals-hero__subtitle">
          Compare card EMI, bank EMI, and no-cost EMI plans from partner providers. Apply online
          for large gear purchases before checkout.
        </p>
      </header>

      <div className="finance-grid finance-grid--split" style={{ marginTop: "1.5rem" }}>
        <section className="finance-card" aria-label="EMI calculator">
          <h2>Calculate EMI</h2>
          <div className="finance-form">
            <label>
              Order value (₹)
              <input
                type="number"
                min={1000}
                value={orderValue}
                onChange={(e) => setOrderValue(Number(e.target.value))}
              />
            </label>
            <label>
              Down payment (₹)
              <input
                type="number"
                min={0}
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
              />
            </label>
            <label>
              EMI type
              <select value={emiType} onChange={(e) => setEmiType(e.target.value)}>
                <option value="">All types</option>
                <option value="card">Card EMI</option>
                <option value="bank">Bank EMI</option>
                <option value="bnpl">BNPL</option>
              </select>
            </label>
            <button
              type="button"
              className="finance-btn"
              onClick={() => compareMutation.mutate()}
              disabled={compareMutation.isPending}
            >
              {compareMutation.isPending ? "Calculating…" : "Compare plans"}
            </button>
          </div>
        </section>

        <section className="finance-card">
          <h2>Partner providers</h2>
          {providers.length === 0 ? (
            <p>No finance providers configured yet.</p>
          ) : (
            <ul>
              {providers.map((p) => (
                <li key={p.id} style={{ marginBottom: "0.5rem" }}>
                  <strong>{p.name}</strong> · {p.type}
                  {typeof p.planCount === "number" ? ` · ${p.planCount} plans` : ""}
                </li>
              ))}
            </ul>
          )}
          <Link href={ROUTES.financingApply} className="finance-btn" style={{ marginTop: "1rem" }}>
            Apply for financing
          </Link>
        </section>
      </div>

      {compareMutation.data ? (
        <section className="finance-card" style={{ marginTop: "1.5rem" }}>
          <h2>Available plans</h2>
          <div className="finance-plans">
            {compareMutation.data.map((row) => (
              <div
                key={row.plan.id}
                className={`finance-plan-row ${row.eligible ? "finance-plan-row--eligible" : "finance-plan-row--ineligible"}`}
              >
                <div>
                  <strong>{row.provider.name}</strong> — {row.plan.name}
                  <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                    {row.plan.tenureMonths} months · {row.plan.emiType.toUpperCase()} EMI
                    {row.plan.isNoCostEmi ? (
                      <span className="finance-badge" style={{ marginLeft: 8 }}>
                        No-cost EMI
                      </span>
                    ) : null}
                  </div>
                  {!row.eligible && row.reasons[0] ? (
                    <div style={{ fontSize: "0.8rem", color: "#b45309" }}>{row.reasons[0]}</div>
                  ) : null}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>{formatCurrency(row.calculation.monthlyInstallment)}/mo</div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.75 }}>
                    Total {formatCurrency(row.calculation.totalPayable)}
                  </div>
                  {row.eligible ? (
                    <Link
                      href={`${ROUTES.financingApply}?plan=${row.plan.id}&orderValue=${orderValue}&downPayment=${downPayment}`}
                      className="finance-btn finance-btn--secondary"
                      style={{ marginTop: 8, fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                    >
                      Apply
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

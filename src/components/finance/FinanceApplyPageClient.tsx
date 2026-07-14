"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import { useAuthStore } from "@/store/authStore";

function FinanceApplyForm() {
  const params = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const planId = params.get("plan") ?? "";
  const [orderValue, setOrderValue] = useState(Number(params.get("orderValue") ?? 25000));
  const [downPayment, setDownPayment] = useState(Number(params.get("downPayment") ?? 0));
  const [productName, setProductName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [employmentType, setEmploymentType] = useState("salaried");
  const [monthlyIncome, setMonthlyIncome] = useState<number | "">("");
  const [selectedPlanId, setSelectedPlanId] = useState(planId);

  const { data: plansData } = useQuery({
    queryKey: ["finance-plans-apply"],
    queryFn: async () => {
      const res = await fetch("/api/finance/plans");
      return res.json() as Promise<{ plans: Array<{ id: string; name: string; providerName?: string; tenureMonths: number }> }>;
    },
  });

  const eligibilityQuery = useQuery({
    queryKey: ["finance-eligibility-apply", selectedPlanId, orderValue, downPayment, monthlyIncome],
    enabled: Boolean(selectedPlanId && orderValue),
    queryFn: async () => {
      const res = await fetch("/api/finance/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          orderValue,
          downPayment,
          monthlyIncome: monthlyIncome === "" ? undefined : Number(monthlyIncome),
        }),
      });
      return res.json();
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/finance/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          productName,
          orderValue,
          downPayment,
          email,
          customerName,
          customerPhone,
          panNumber: panNumber || undefined,
          employmentType,
          monthlyIncome: monthlyIncome === "" ? undefined : Number(monthlyIncome),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Application failed");
      return json.application as { id: string; applicationNumber: string };
    },
    onSuccess: (app) => {
      router.push(ROUTES.accountFinanceApplication(app.id));
    },
  });

  const eligibility = eligibilityQuery.data;
  const canSubmit =
    selectedPlanId &&
    productName &&
    email &&
    customerName &&
    customerPhone &&
    eligibility?.eligible;

  return (
    <main className="storefront-page finance-page">
      <Link href={ROUTES.financing}>← Back to EMI calculator</Link>
      <h1 className="rentals-hero__title" style={{ marginTop: "1rem" }}>
        Finance application
      </h1>

      <div className="finance-card" style={{ marginTop: "1rem", maxWidth: 560 }}>
        <div className="finance-form">
          <label>
            Finance plan
            <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} required>
              <option value="">Select plan</option>
              {(plansData?.plans ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.providerName} — {p.name} ({p.tenureMonths} mo)
                </option>
              ))}
            </select>
          </label>
          <label>
            Product / gear name
            <input value={productName} onChange={(e) => setProductName(e.target.value)} required />
          </label>
          <label>
            Order value (₹)
            <input type="number" value={orderValue} onChange={(e) => setOrderValue(Number(e.target.value))} />
          </label>
          <label>
            Down payment (₹)
            <input type="number" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} />
          </label>
          <label>
            Full name
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Phone
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
          </label>
          <label>
            PAN (optional)
            <input value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} maxLength={10} />
          </label>
          <label>
            Employment
            <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
              <option value="salaried">Salaried</option>
              <option value="self_employed">Self employed</option>
              <option value="student">Student</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Monthly income (₹)
            <input
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value ? Number(e.target.value) : "")}
            />
          </label>

          {eligibility?.calculation ? (
            <div className="finance-result">
              <p>
                EMI: <strong>{formatCurrency(eligibility.calculation.monthlyInstallment)}/month</strong>
              </p>
              <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                Total payable: {formatCurrency(eligibility.calculation.totalPayable)}
              </p>
              {!eligibility.eligible && eligibility.reasons?.[0] ? (
                <p role="alert">{eligibility.reasons[0]}</p>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            className="finance-btn"
            disabled={!canSubmit || applyMutation.isPending}
            onClick={() => applyMutation.mutate()}
          >
            {applyMutation.isPending ? "Submitting…" : "Submit application"}
          </button>
          {applyMutation.error ? <p role="alert">{applyMutation.error.message}</p> : null}
        </div>
      </div>
    </main>
  );
}

export default function FinanceApplyPageClient() {
  return (
    <Suspense fallback={<main className="finance-page"><p>Loading…</p></main>}>
      <FinanceApplyForm />
    </Suspense>
  );
}

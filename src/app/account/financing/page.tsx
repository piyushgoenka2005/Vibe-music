"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import AccountShell from "@/components/account/AccountShell";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import "@/styles/finance.css";

export default function AccountFinancingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["account-finance"],
    queryFn: async () => {
      const res = await fetch("/api/finance/account/applications");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const applications = data?.applications ?? [];

  return (
    <AccountShell>
      <h1>My finance applications</h1>
      <p style={{ marginBottom: "1rem" }}>
        Installment plans are not currently available. Pay at checkout with UPI, cards, or net
        banking.
      </p>
      {isLoading ? (
        <p>Loading…</p>
      ) : applications.length === 0 ? (
        <p>No finance applications yet.</p>
      ) : (
        <div className="finance-list">
          {applications.map((app: {
            id: string;
            applicationNumber: string;
            productName: string;
            status: string;
            monthlyInstallment: number;
            tenureMonths: number;
          }) => (
            <article key={app.id} className="finance-list-item">
              <strong>{app.applicationNumber}</strong>
              <div>{app.productName}</div>
              <div>{app.status}</div>
              <div>
                {formatCurrency(app.monthlyInstallment)}/mo × {app.tenureMonths}
              </div>
              <Link href={ROUTES.accountFinanceApplication(app.id)}>View details</Link>
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}

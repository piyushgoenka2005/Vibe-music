"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AccountShell from "@/components/account/AccountShell";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import "@/styles/finance.css";

export default function AccountFinanceDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["account-finance-detail", params.id],
    enabled: Boolean(params.id),
    queryFn: async () => {
      const res = await fetch(`/api/finance/applications/${params.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const app = data?.application;

  return (
    <AccountShell>
      <Link href={ROUTES.accountFinancing}>← Back to applications</Link>
      {isLoading || !app ? (
        <p style={{ marginTop: "1rem" }}>Loading…</p>
      ) : (
        <div className="finance-list-item" style={{ marginTop: "1rem" }}>
          <h1>{app.applicationNumber}</h1>
          <p>{app.productName}</p>
          <p>Status: {app.status}</p>
          <p>Monthly payment: {formatCurrency(app.monthlyInstallment)}/month × {app.tenureMonths}</p>
          <p>Total payable: {formatCurrency(app.totalPayable)}</p>
          {app.rejectionReason ? <p>Reason: {app.rejectionReason}</p> : null}
        </div>
      )}
    </AccountShell>
  );
}

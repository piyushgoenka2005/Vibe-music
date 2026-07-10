"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Headset } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import type { SupportTicket } from "@/types/supportTicket";

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export default function AccountSupportPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["account-support-tickets"],
    queryFn: async () => {
      const res = await fetch("/api/support/tickets");
      if (!res.ok) throw new Error("Failed to load tickets");
      return res.json() as Promise<{ tickets: SupportTicket[] }>;
    },
  });

  const tickets = data?.tickets ?? [];

  return (
    <div>
      <h2 className="acct__section-title">
        <Headset
          size={20}
          style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }}
        />
        Support tickets
      </h2>
      <p className="acct__section-sub">
        Track requests submitted through the help widget or contact form.
      </p>

      {isLoading ? (
        <p className="acct__section-sub">Loading tickets…</p>
      ) : error ? (
        <p className="acct__section-sub">Unable to load your support tickets.</p>
      ) : tickets.length === 0 ? (
        <div className="acct__card">
          <div className="acct__card-body">
            <p>No support tickets yet.</p>
            <p style={{ marginTop: "0.75rem" }}>
              Use the Support button on any page or visit{" "}
              <Link href={ROUTES.contact}>Contact</Link>.
            </p>
          </div>
        </div>
      ) : (
        <div className="acct__card">
          <div className="acct__card-body">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="acct__setting-row">
                <div className="acct__setting-info">
                  <h4>{ticket.subject}</h4>
                  <p>
                    {ticket.status.replace("_", " ")} · {formatDate(ticket.createdAt)}
                  </p>
                  <p>{ticket.message}</p>
                  {ticket.adminNote ? (
                    <p>
                      <strong>Support reply:</strong> {ticket.adminNote}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

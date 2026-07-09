"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order } from "@/types/order";
import type { ReturnRequest } from "@/types/returnRequest";

const RETURN_REASONS = [
  "Wrong item received",
  "Item damaged in transit",
  "Not as described",
  "Changed my mind",
  "Other",
];

interface ReturnRequestFormProps {
  order: Order;
}

export default function ReturnRequestForm({ order }: ReturnRequestFormProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["order-returns", order.id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${order.id}/return`);
      if (!res.ok) return { returns: [] as ReturnRequest[] };
      return res.json() as Promise<{ returns: ReturnRequest[] }>;
    },
  });

  const openRequest = data?.returns.find((item) =>
    ["pending", "approved", "received"].includes(item.status)
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/orders/${order.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Unable to submit return request");
      }
    },
    onSuccess: () => {
      setMessage("Return request submitted. Our team will contact you shortly.");
      setDetails("");
      queryClient.invalidateQueries({ queryKey: ["order-returns", order.id] });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  if (!["shipped", "delivered"].includes(order.status)) {
    return null;
  }

  if (openRequest) {
    return (
      <section className="acct__card acct__card--spaced" aria-label="Return request">
        <div className="acct__card-body">
          <h3 className="acct__card-title">Return request</h3>
          <p className="acct__muted">
            Status: <strong>{openRequest.status}</strong> — submitted on{" "}
            {new Date(openRequest.createdAt).toLocaleDateString("en-IN")}
          </p>
          <p className="acct__muted">Reason: {openRequest.reason}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="acct__card acct__card--spaced" aria-label="Request a return">
      <div className="acct__card-header">
        <h3 className="acct__card-title">Request a return</h3>
      </div>
      <div className="acct__card-body">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMessage(null);
            mutation.mutate();
          }}
        >
          <div className="acct__form-grid">
            <div className="acct__field">
              <label className="acct__label" htmlFor={`return-reason-${order.id}`}>
                Reason
              </label>
              <select
                id={`return-reason-${order.id}`}
                className="acct__input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {RETURN_REASONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="acct__field acct__field--full">
              <label className="acct__label" htmlFor={`return-details-${order.id}`}>
                Additional details (optional)
              </label>
              <textarea
                id={`return-details-${order.id}`}
                className="acct__input"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>
          <div className="acct__form-actions">
            <button
              type="submit"
              className="acct__btn acct__btn--secondary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Submitting…" : "Submit return request"}
            </button>
          </div>
          {message ? <p className="acct__muted" style={{ marginTop: "0.75rem" }}>{message}</p> : null}
        </form>
      </div>
    </section>
  );
}

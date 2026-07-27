"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState, EmptyState, StatusBadge, formatDate } from "@/components/admin/AdminUi";
import { ErrorState, MutationError } from "@/components/admin/AdminQueryState";
import type { ProductQuestion, ProductQuestionStatus } from "@/types/productQuestion";

function QuestionsContent() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selected, setSelected] = useState<ProductQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [newStatus, setNewStatus] = useState<ProductQuestionStatus>("approved");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-questions", statusFilter],
    queryFn: async () => {
      const qs = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/admin/questions${qs}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ questions: ProductQuestion[] }>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const res = await fetch(`/api/admin/questions/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          answer: answer || undefined,
        }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => {
      setSelected(null);
      setAnswer("");
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState
        message="Unable to load product questions."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const questions = data?.questions ?? [];

  return (
    <div className="admin-grid-2">
      <div className="admin-panel">
        <div className="admin-toolbar">
          <select
            className="admin-select"
            style={{ width: "auto" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {questions.length === 0 ? (
          <EmptyState message="No product questions." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Question</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((item) => (
                  <tr
                    key={item.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelected(item);
                      setAnswer(item.answer ?? "");
                      setNewStatus(item.status);
                    }}
                  >
                    <td>{item.productName}</td>
                    <td>{item.question.slice(0, 60)}{item.question.length > 60 ? "…" : ""}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Moderate question</h2>
        </div>
        <div className="admin-panel__body">
          {!selected ? (
            <EmptyState message="Select a question to moderate." />
          ) : (
            <>
              <p>
                <strong>Product:</strong> {selected.productName}
              </p>
              <p>
                <strong>Asked by:</strong> {selected.author}
              </p>
              <p>
                <strong>Question:</strong> {selected.question}
              </p>
              <div className="admin-form-group" style={{ marginTop: "1rem" }}>
                <label>Answer</label>
                <textarea
                  className="admin-textarea"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Write an official answer for the storefront"
                />
              </div>
              <div className="admin-form-group">
                <label>Status</label>
                <select
                  className="admin-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ProductQuestionStatus)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate()}
              >
                {updateMutation.isPending ? "Saving…" : "Save"}
              </button>
              <MutationError error={updateMutation.isError ? updateMutation.error : null} />
              <MutationError error={deleteMutation.isError ? deleteMutation.error : null} />
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                style={{ marginLeft: "0.5rem" }}
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (!selected) return;
                  if (window.confirm("Delete this product question?")) {
                    deleteMutation.mutate(selected.id);
                  }
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminQuestionsPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Product Q&A">
          <QuestionsContent />
        </AdminShell>
      )}
    </AdminGuard>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminShell from "@/components/admin/AdminShell";
import { LoadingState, EmptyState, StatusBadge, formatDate } from "@/components/admin/AdminUi";
import type { SupportTicket, SupportTicketStatus } from "@/types/supportTicket";

type InboxTab = "tickets" | "contact";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: "new" | "read";
  createdAt: string;
}

function SupportTicketsPanel() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState<SupportTicketStatus>("in_progress");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-support", statusFilter],
    queryFn: async () => {
      const qs = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/admin/support-tickets${qs}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ tickets: SupportTicket[] }>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const res = await fetch(`/api/admin/support-tickets/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNote: adminNote || undefined }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => {
      setSelected(null);
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-support"] });
    },
  });

  if (isLoading) return <LoadingState />;

  const tickets = data?.tickets ?? [];

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
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="waiting_customer">Waiting customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        {tickets.length === 0 ? (
          <EmptyState message="No support tickets." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelected(ticket);
                      setNewStatus(ticket.status);
                      setAdminNote(ticket.adminNote ?? "");
                    }}
                  >
                    <td>{ticket.subject}</td>
                    <td>{ticket.name}</td>
                    <td>{ticket.category}</td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td>{formatDate(ticket.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Ticket detail</h2>
        </div>
        <div className="admin-panel__body">
          {!selected ? (
            <EmptyState message="Select a support ticket." />
          ) : (
            <>
              <p><strong>From:</strong> {selected.name} ({selected.email})</p>
              <p><strong>Subject:</strong> {selected.subject}</p>
              {selected.orderId ? <p><strong>Order:</strong> {selected.orderId}</p> : null}
              <p style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>{selected.message}</p>
              <div className="admin-form-group" style={{ marginTop: "1rem" }}>
                <label>Status</label>
                <select
                  className="admin-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as SupportTicketStatus)}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="waiting_customer">Waiting customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Admin note</label>
                <textarea
                  className="admin-textarea"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate()}
              >
                {updateMutation.isPending ? "Saving…" : "Update ticket"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactMessagesPanel() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-contact", statusFilter],
    queryFn: async () => {
      const qs = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/admin/contact-messages${qs}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ messages: ContactMessage[] }>;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (message: ContactMessage) => {
      const res = await fetch(`/api/admin/contact-messages/${message.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json() as Promise<{ message: ContactMessage }>;
    },
    onSuccess: (result) => {
      setSelected(result.message);
      queryClient.invalidateQueries({ queryKey: ["admin-contact"] });
    },
  });

  if (isLoading) return <LoadingState />;

  const messages = data?.messages ?? [];

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
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
          </select>
        </div>
        {messages.length === 0 ? (
          <EmptyState message="No contact form messages." />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>From</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => (
                  <tr
                    key={message.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelected(message);
                      if (message.status === "new") {
                        markReadMutation.mutate(message);
                      }
                    }}
                  >
                    <td>{message.subject}</td>
                    <td>{message.name}</td>
                    <td><StatusBadge status={message.status} /></td>
                    <td>{formatDate(message.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Contact message</h2>
        </div>
        <div className="admin-panel__body">
          {!selected ? (
            <EmptyState message="Select a contact message." />
          ) : (
            <>
              <p><strong>From:</strong> {selected.name} ({selected.email})</p>
              {selected.phone ? <p><strong>Phone:</strong> {selected.phone}</p> : null}
              <p><strong>Subject:</strong> {selected.subject}</p>
              <p><strong>Status:</strong> {selected.status}</p>
              <p style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>{selected.message}</p>
              <p style={{ marginTop: "1rem" }}>
                <a className="admin-btn admin-btn--primary" href={`mailto:${selected.email}?subject=Re:%20${encodeURIComponent(selected.subject)}`}>
                  Reply by email
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SupportContent() {
  const [tab, setTab] = useState<InboxTab>("tickets");

  return (
    <div>
      <div className="admin-toolbar" style={{ marginBottom: "1rem", gap: "0.5rem" }}>
        <button
          type="button"
          className={`admin-btn${tab === "tickets" ? " admin-btn--primary" : ""}`}
          onClick={() => setTab("tickets")}
        >
          Support tickets
        </button>
        <button
          type="button"
          className={`admin-btn${tab === "contact" ? " admin-btn--primary" : ""}`}
          onClick={() => setTab("contact")}
        >
          Contact form
        </button>
      </div>
      {tab === "tickets" ? <SupportTicketsPanel /> : <ContactMessagesPanel />}
    </div>
  );
}

export default function AdminSupportPage() {
  return (
    <AdminGuard>
      {(admin) => (
        <AdminShell admin={admin} title="Support inbox">
          {admin.permissions.includes("orders:read") ? (
            <SupportContent />
          ) : (
            <EmptyState message="Insufficient permissions." />
          )}
        </AdminShell>
      )}
    </AdminGuard>
  );
}

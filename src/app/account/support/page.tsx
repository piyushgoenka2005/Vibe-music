"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Headset,
  HelpCircle,
  MessageSquare,
  Package,
  Plus,
  RotateCcw,
  Send,
  Truck,
  X,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";
import type {
  SupportTicket,
  SupportTicketCategory,
  SupportTicketStatus,
} from "@/types/supportTicket";

const CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  order: "Order Inquiry",
  shipping: "Shipping & Delivery",
  returns: "Returns & Exchange",
  product: "Product & Gear Advice",
  payment: "Payment & Billing",
  other: "General Support",
};

const CATEGORY_ICONS: Record<
  SupportTicketCategory,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  order: Package,
  shipping: Truck,
  returns: RotateCcw,
  product: HelpCircle,
  payment: HelpCircle,
  other: MessageSquare,
};

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_customer: "Action Required",
  resolved: "Resolved",
  closed: "Closed",
};

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function AccountSupportPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [filterTab, setFilterTab] = useState<"all" | "open" | "resolved">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "order" as SupportTicketCategory,
    orderId: "",
    message: "",
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["account-support-tickets"],
    queryFn: async () => {
      const res = await fetch("/api/support/tickets");
      if (!res.ok) throw new Error("Failed to load tickets");
      return res.json() as Promise<{ tickets: SupportTicket[] }>;
    },
  });

  const tickets = data?.tickets ?? [];

  // Listen to external support ticket creation events (e.g. from HelpWidget or Contact)
  useEffect(() => {
    const handleTicketCreated = () => {
      void refetch();
    };
    window.addEventListener("vibe:support-ticket-created", handleTicketCreated);
    return () => {
      window.removeEventListener("vibe:support-ticket-created", handleTicketCreated);
    };
  }, [refetch]);

  const openHelpWidget = useCallback(() => {
    window.dispatchEvent(new CustomEvent("vibe:open-help-widget"));
  }, []);

  const createTicketMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      subject: string;
      category: SupportTicketCategory;
      orderId?: string;
      message: string;
    }) => {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(resData.error ?? "Failed to create support ticket");
      }
      return resData;
    },
    onSuccess: (res) => {
      setFormFeedback({
        type: "success",
        message:
          res.message ??
          "Your support ticket has been submitted. Our team will get back to you shortly.",
      });
      setTicketForm({
        subject: "",
        category: "order",
        orderId: "",
        message: "",
      });
      queryClient.invalidateQueries({ queryKey: ["account-support-tickets"] });
      window.dispatchEvent(new CustomEvent("vibe:support-ticket-created"));
      setTimeout(() => {
        setShowCreateForm(false);
        setFormFeedback(null);
      }, 2500);
    },
    onError: (err) => {
      setFormFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Unable to create support ticket. Please try again.",
      });
    },
  });

  function handleSubmitTicket(e: FormEvent) {
    e.preventDefault();
    if (!user?.email) {
      setFormFeedback({
        type: "error",
        message: "You must be logged in to submit a support ticket.",
      });
      return;
    }
    setFormFeedback(null);
    createTicketMutation.mutate({
      name: user.name || "Customer",
      email: user.email,
      subject: ticketForm.subject.trim(),
      category: ticketForm.category,
      orderId: ticketForm.orderId.trim() || undefined,
      message: ticketForm.message.trim(),
    });
  }

  // Filter tickets by selected tab
  const filteredTickets = tickets.filter((ticket) => {
    if (filterTab === "open") {
      return (
        ticket.status === "open" ||
        ticket.status === "in_progress" ||
        ticket.status === "waiting_customer"
      );
    }
    if (filterTab === "resolved") {
      return ticket.status === "resolved" || ticket.status === "closed";
    }
    return true;
  });

  const openCount = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress" || t.status === "waiting_customer",
  ).length;
  const resolvedCount = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed",
  ).length;

  return (
    <div>
      {/* Header section */}
      <div className="acct__section-head">
        <div>
          <h1 className="acct__section-title">
            <Headset
              size={22}
              style={{
                display: "inline",
                marginRight: 8,
                verticalAlign: "middle",
                color: "var(--acct-blue, #0d47a1)",
              }}
            />
            Support tickets
          </h1>
          <p className="acct__section-sub">
            Track requests submitted through the help widget or contact form.
          </p>
        </div>

        <div className="acct__head-actions">
          <button
            type="button"
            className="acct__btn acct__btn--secondary"
            onClick={openHelpWidget}
            title="Open instant help widget"
          >
            <Headset size={16} aria-hidden />
            Support widget
          </button>
          <button
            type="button"
            className={`acct__btn ${
              showCreateForm ? "acct__btn--secondary" : "acct__btn--primary"
            }`}
            onClick={() => {
              setShowCreateForm((prev) => !prev);
              setFormFeedback(null);
            }}
          >
            {showCreateForm ? (
              <>
                <X size={16} aria-hidden />
                Cancel
              </>
            ) : (
              <>
                <Plus size={16} aria-hidden />
                New ticket
              </>
            )}
          </button>
        </div>
      </div>

      {/* Create Support Ticket Card Form */}
      {showCreateForm ? (
        <section className="acct__ticket-create-card" aria-label="Create support ticket">
          <div className="acct__card-header">
            <h3 className="acct__card-title">Submit a new support ticket</h3>
            <button
              type="button"
              className="acct__btn acct__btn--ghost"
              onClick={() => setShowCreateForm(false)}
              aria-label="Close form"
            >
              <X size={16} />
            </button>
          </div>

          <div className="acct__card-body">
            {formFeedback ? (
              <div
                className="acct__ticket-order"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: formFeedback.type === "success" ? "#ecfdf5" : "#fef2f2",
                  color: formFeedback.type === "success" ? "#065f46" : "#b91c1c",
                  border: `1px solid ${formFeedback.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                }}
                role="status"
              >
                {formFeedback.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{formFeedback.message}</span>
              </div>
            ) : null}

            <form onSubmit={handleSubmitTicket}>
              <div className="acct__form-grid">
                <div className="acct__form-field">
                  <label htmlFor="ticket-subject">Subject</label>
                  <input
                    id="ticket-subject"
                    required
                    type="text"
                    placeholder="e.g. Order delivery status / Setup assistance"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  />
                </div>

                <div className="acct__form-field">
                  <label htmlFor="ticket-category">Category</label>
                  <select
                    id="ticket-category"
                    value={ticketForm.category}
                    onChange={(e) =>
                      setTicketForm({
                        ...ticketForm,
                        category: e.target.value as SupportTicketCategory,
                      })
                    }
                  >
                    <option value="order">Order Inquiry</option>
                    <option value="shipping">Shipping & Delivery</option>
                    <option value="returns">Returns & Exchange</option>
                    <option value="product">Product & Gear Advice</option>
                    <option value="payment">Payment & Billing</option>
                    <option value="other">General Support</option>
                  </select>
                </div>

                <div className="acct__form-field">
                  <label htmlFor="ticket-orderId">
                    Order ID <span style={{ fontWeight: 400, color: "#64748b" }}>(Optional)</span>
                  </label>
                  <input
                    id="ticket-orderId"
                    type="text"
                    placeholder="e.g. ORD-1002"
                    value={ticketForm.orderId}
                    onChange={(e) => setTicketForm({ ...ticketForm, orderId: e.target.value })}
                  />
                </div>
              </div>

              <div className="acct__form-field">
                <label htmlFor="ticket-message">Message / Details</label>
                <textarea
                  id="ticket-message"
                  required
                  rows={4}
                  placeholder="Please provide details about your request so our support team can assist you quickly..."
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                />
              </div>

              <div className="acct__form-actions">
                <button
                  type="button"
                  className="acct__btn acct__btn--secondary"
                  onClick={() => setShowCreateForm(false)}
                  disabled={createTicketMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="acct__btn acct__btn--primary"
                  disabled={createTicketMutation.isPending}
                >
                  <Send size={15} aria-hidden />
                  {createTicketMutation.isPending ? "Submitting…" : "Submit ticket"}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      {/* Filter Tabs */}
      {tickets.length > 0 ? (
        <div className="acct__filter-bar" role="tablist" aria-label="Filter tickets by status">
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === "all"}
            className={`acct__filter-btn ${filterTab === "all" ? "acct__filter-btn--active" : ""}`}
            onClick={() => setFilterTab("all")}
          >
            All tickets
            <span className="acct__filter-count">{tickets.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === "open"}
            className={`acct__filter-btn ${filterTab === "open" ? "acct__filter-btn--active" : ""}`}
            onClick={() => setFilterTab("open")}
          >
            Open &amp; In Progress
            <span className="acct__filter-count">{openCount}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === "resolved"}
            className={`acct__filter-btn ${
              filterTab === "resolved" ? "acct__filter-btn--active" : ""
            }`}
            onClick={() => setFilterTab("resolved")}
          >
            Resolved
            <span className="acct__filter-count">{resolvedCount}</span>
          </button>
        </div>
      ) : null}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="acct__card">
          <div className="acct__card-body" style={{ textAlign: "center", padding: "40px 20px" }}>
            <p className="acct__section-sub">Loading your support tickets…</p>
          </div>
        </div>
      ) : error ? (
        <div className="acct__card">
          <div className="acct__card-body" style={{ textAlign: "center", padding: "32px 20px" }}>
            <AlertCircle size={32} style={{ color: "#ef4444", marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: "#1e293b" }}>
              Unable to load your support tickets.
            </p>
            <button
              type="button"
              className="acct__btn acct__btn--secondary"
              style={{ marginTop: 16 }}
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="acct__empty-state">
          <div className="acct__empty-icon" aria-hidden>
            <Headset size={28} />
          </div>
          <h2 className="acct__empty-title">No support tickets yet.</h2>
          <p className="acct__empty-desc">
            Track requests submitted through the help widget or contact form. Have a question about
            an order, delivery, or gear? Submit a ticket directly or reach us anytime.
          </p>
          <div className="acct__empty-actions">
            <button
              type="button"
              className="acct__btn acct__btn--primary"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={16} aria-hidden />
              Create a support ticket
            </button>
            <button
              type="button"
              className="acct__btn acct__btn--secondary"
              onClick={openHelpWidget}
            >
              <Headset size={16} aria-hidden />
              Support button
            </button>
          </div>
          <p className="acct__empty-sub">
            Use the{" "}
            <button
              type="button"
              onClick={openHelpWidget}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#0d47a1",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Support button
            </button>{" "}
            on any page or visit <Link href={ROUTES.contact}>Contact</Link>.
          </p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="acct__empty-state">
          <div className="acct__empty-icon" aria-hidden>
            <HelpCircle size={28} />
          </div>
          <h2 className="acct__empty-title">No {filterTab} tickets found</h2>
          <p className="acct__empty-desc">
            You don&apos;t have any tickets matching the current filter.
          </p>
          <button
            type="button"
            className="acct__btn acct__btn--secondary"
            onClick={() => setFilterTab("all")}
          >
            View all tickets
          </button>
        </div>
      ) : (
        <div className="acct__ticket-stack">
          {filteredTickets.map((ticket) => {
            const CategoryIcon =
              CATEGORY_ICONS[ticket.category as SupportTicketCategory] ?? MessageSquare;
            const categoryLabel =
              CATEGORY_LABELS[ticket.category as SupportTicketCategory] ?? ticket.category;
            const statusLabel =
              STATUS_LABELS[ticket.status as SupportTicketStatus] ??
              ticket.status.replace("_", " ");
            const badgeClass = `acct__badge--${ticket.status}`;

            return (
              <article key={ticket.id} className="acct__ticket-item">
                <header className="acct__ticket-header">
                  <div className="acct__ticket-meta-left">
                    <span className="acct__ticket-id">#{ticket.id.slice(0, 8).toUpperCase()}</span>
                    <span className="acct__category-tag">
                      <CategoryIcon size={14} aria-hidden />
                      {categoryLabel}
                    </span>
                    {ticket.orderId ? (
                      <span className="acct__ticket-order" style={{ margin: 0 }}>
                        <Package size={13} aria-hidden />
                        Order: {ticket.orderId}
                      </span>
                    ) : null}
                  </div>

                  <span className={`acct__badge ${badgeClass}`}>
                    <span className="acct__badge-dot" aria-hidden />
                    {statusLabel}
                  </span>
                </header>

                <h3 className="acct__ticket-subject">{ticket.subject}</h3>
                <p className="acct__ticket-message">{ticket.message}</p>

                {ticket.adminNote ? (
                  <div className="acct__support-reply">
                    <div className="acct__support-reply-header">
                      <Headset size={15} aria-hidden />
                      <span>Vibe Music Support Team</span>
                    </div>
                    <p className="acct__support-reply-body">{ticket.adminNote}</p>
                  </div>
                ) : null}

                <footer className="acct__ticket-footer">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Clock size={13} aria-hidden />
                    Submitted on {formatDate(ticket.createdAt)}
                  </span>
                  {ticket.resolvedAt ? (
                    <span style={{ color: "#059669", fontWeight: 500 }}>
                      Resolved on {formatDate(ticket.resolvedAt)}
                    </span>
                  ) : (
                    <span>Typical response time: 1–2 business days</span>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import "@/styles/help-widget.css";
import Link from "next/link";
import {
  ChevronRight,
  Clock,
  Headset,
  MessageCircle,
  Package,
  Phone,
  RotateCcw,
  ShieldAlert,
  Truck,
  X,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";
import {
  HELP_WIDGET_DISCLAIMER,
  HELP_WIDGET_HOURS,
  HELP_WIDGET_INTRO,
  HELP_WIDGET_LINKS,
} from "@/data/helpWidget";

const LINK_ICONS = {
  package: Package,
  rotate: RotateCcw,
  truck: Truck,
  shield: ShieldAlert,
  headset: Headset,
} as const;

export default function HelpWidget() {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setLoading(false);
  }, []);

  const openPanel = useCallback(() => {
    setLoading(true);
    setOpen(true);
    if (user) {
      setTicketForm((current) => ({
        ...current,
        name: current.name || user.name || "",
        email: current.email || user.email || "",
      }));
    }
    window.setTimeout(() => setLoading(false), 380);
  }, [user]);

  const toggle = useCallback(() => {
    if (open) {
      close();
      return;
    }
    openPanel();
  }, [close, open, openPanel]);

  async function submitTicket(event: React.FormEvent) {
    event.preventDefault();
    setTicketSubmitting(true);
    setTicketStatus(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ticketForm,
          category: "other",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Unable to submit ticket");
      setTicketStatus(body.message ?? "Ticket submitted.");
      setTicketForm((current) => ({
        ...current,
        subject: "",
        message: "",
      }));
      setShowTicketForm(false);
    } catch (error) {
      setTicketStatus(
        error instanceof Error ? error.message : "Unable to submit ticket."
      );
    } finally {
      setTicketSubmitting(false);
    }
  }

  useEffect(() => {
    if (!open) return undefined;

    const frame = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  useEffect(() => {
    if (!open) return undefined;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close, open]);

  return (
    <div className={`help-widget${open ? " help-widget--open" : ""}`} ref={rootRef}>
      {open ? (
        <>
          <button
            aria-label="Close support panel"
            className="help-widget__backdrop"
            onClick={close}
            type="button"
          />
          <div
            aria-labelledby={`${panelId}-title`}
            className="help-widget__panel"
            id={panelId}
            role="dialog"
            aria-modal="true"
          >
          <header className="help-widget__header">
            <div className="help-widget__header-copy">
              <p className="help-widget__eyebrow">{BRAND.supportRole}</p>
              <h2 className="help-widget__title" id={`${panelId}-title`}>
                How can we help?
              </h2>
            </div>
            <button
              aria-label="Close support panel"
              className="help-widget__close"
              onClick={close}
              ref={closeButtonRef}
              type="button"
            >
              <X aria-hidden size={18} strokeWidth={2.25} />
            </button>
          </header>

          <div className="help-widget__body">
            <p className="help-widget__intro">{HELP_WIDGET_INTRO}</p>

            <nav aria-label="Support links" className="help-widget__links">
              {HELP_WIDGET_LINKS.map((link) => {
                const Icon = LINK_ICONS[link.icon];
                return (
                  <Link
                    key={link.href}
                    className="help-widget__link"
                    href={link.href}
                    onClick={close}
                  >
                    <span className="help-widget__link-icon" aria-hidden>
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span className="help-widget__link-label">{link.label}</span>
                    <ChevronRight
                      aria-hidden
                      className="help-widget__link-chevron"
                      size={16}
                      strokeWidth={2}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="help-widget__actions">
              {user ? (
                <Link
                  className="help-widget__action-btn help-widget__action-btn--secondary"
                  href={ROUTES.accountSupport}
                  onClick={close}
                >
                  <Headset aria-hidden size={18} strokeWidth={2} />
                  My support tickets
                </Link>
              ) : null}
              <button
                type="button"
                className="help-widget__action-btn help-widget__action-btn--primary"
                onClick={() => setShowTicketForm((value) => !value)}
              >
                <MessageCircle aria-hidden size={18} strokeWidth={2} />
                Open support ticket
              </button>
              <a
                className="help-widget__action-btn help-widget__action-btn--secondary"
                href={`mailto:${BRAND.email}?subject=Support%20request`}
                onClick={close}
              >
                <MessageCircle aria-hidden size={18} strokeWidth={2} />
                Email support
              </a>
              {BRAND.phoneTel ? (
                <a
                  className="help-widget__action-btn help-widget__action-btn--secondary"
                  href={`tel:${BRAND.phoneTel}`}
                  onClick={close}
                >
                  <Phone aria-hidden size={18} strokeWidth={2} />
                  {BRAND.phoneDisplay}
                </a>
              ) : null}
            </div>

            {showTicketForm ? (
              <form className="help-widget__ticket-form" onSubmit={submitTicket}>
                <label>
                  Name
                  <input
                    required
                    value={ticketForm.name}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Email
                  <input
                    required
                    type="email"
                    value={ticketForm.email}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, email: e.target.value })
                    }
                  />
                </label>
                <label>
                  Subject
                  <input
                    required
                    value={ticketForm.subject}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, subject: e.target.value })
                    }
                  />
                </label>
                <label>
                  Message
                  <textarea
                    required
                    rows={4}
                    value={ticketForm.message}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, message: e.target.value })
                    }
                  />
                </label>
                <button type="submit" disabled={ticketSubmitting}>
                  {ticketSubmitting ? "Submitting…" : "Submit ticket"}
                </button>
              </form>
            ) : null}

            {ticketStatus ? (
              <p className="help-widget__intro" role="status">
                {ticketStatus}
              </p>
            ) : null}

            <div className="help-widget__hours">
              <div className="help-widget__hours-head">
                <Clock aria-hidden size={14} strokeWidth={2} />
                <span>Support hours</span>
              </div>
              <ul className="help-widget__hours-list">
                {HELP_WIDGET_HOURS.map((slot) => (
                  <li key={slot.day}>
                    <span>{slot.day}</span>
                    <span>{slot.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="help-widget__disclaimer">
              {HELP_WIDGET_DISCLAIMER}{" "}
              <Link
                className="help-widget__disclaimer-link"
                href={`${ROUTES.searchResults}?q=privacy`}
                onClick={close}
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
        </>
      ) : null}

      <button
        aria-controls={open ? panelId : undefined}
        aria-expanded={open}
        aria-label={open ? "Close support" : "Open support"}
        className={`help-widget__trigger${open ? " help-widget__trigger--open" : ""}`}
        onClick={toggle}
        type="button"
      >
        {open ? (
          <X aria-hidden className="help-widget__trigger-icon" size={22} strokeWidth={2.25} />
        ) : (
          <>
            <span className="help-widget__icon-mark" aria-hidden>
              <Headset className="help-widget__icon" size={22} strokeWidth={2.25} />
              <span className="help-widget__status" />
            </span>
            <span className="help-widget__trigger-label">Support</span>
          </>
        )}
        {loading ? (
          <span
            aria-label="Loading support"
            aria-live="polite"
            className="help-widget__loading"
            role="alert"
          />
        ) : null}
      </button>
    </div>
  );
}

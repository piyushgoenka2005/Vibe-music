"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import "@/styles/help-widget.css";
import Link from "next/link";
import {
  ChevronRight,
  Clock,
  Gift,
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
  gift: Gift,
  shield: ShieldAlert,
} as const;

export default function HelpWidget() {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setLoading(false);
  }, []);

  const openPanel = useCallback(() => {
    setLoading(true);
    setOpen(true);
    window.setTimeout(() => setLoading(false), 380);
  }, []);

  const toggle = useCallback(() => {
    if (open) {
      close();
      return;
    }
    openPanel();
  }, [close, open, openPanel]);

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

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close, open]);

  return (
    <div className="help-widget" ref={rootRef}>
      {open ? (
        <div
          aria-labelledby={`${panelId}-title`}
          className="help-widget__panel"
          id={panelId}
          role="dialog"
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
              <a
                className="help-widget__action-btn help-widget__action-btn--primary"
                href={`mailto:${BRAND.email}?subject=Live%20Chat%20Support`}
                onClick={close}
              >
                <MessageCircle aria-hidden size={18} strokeWidth={2} />
                Chat with an advisor
              </a>
              <a
                className="help-widget__action-btn help-widget__action-btn--secondary"
                href={BRAND.phoneTel}
                onClick={close}
              >
                <Phone aria-hidden size={18} strokeWidth={2} />
                {BRAND.phoneDisplay}
              </a>
            </div>

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

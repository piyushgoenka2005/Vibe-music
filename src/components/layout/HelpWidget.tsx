"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Phone, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import {
  HELP_WIDGET_DISCLAIMER,
  HELP_WIDGET_HOURS,
  HELP_WIDGET_INTRO,
  HELP_WIDGET_LINKS,
} from "@/data/helpWidget";

function HelpFabIcon() {
  return (
    <svg
      aria-hidden
      className="help-widget__fab-icon"
      fill="none"
      height="30"
      viewBox="0 0 30 30"
      width="30"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 8.25h15a2.25 2.25 0 0 1 2.25 2.25v8.25a2.25 2.25 0 0 1-2.25 2.25H15.75L11 23.25V8.25h-3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M14.1 12.4c.55-1.05 1.55-1.65 2.85-1.65 1.55 0 2.75 1.05 2.75 2.55 0 1.35-.85 2.05-2.1 2.65-1 .5-1.35.85-1.35 1.55"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle cx="15.15" cy="19.35" fill="currentColor" r="1" />
    </svg>
  );
}

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
            <h2 className="help-widget__title" id={`${panelId}-title`}>
              {BRAND.name} Support
            </h2>
            <button
              aria-label="Close support panel"
              className="help-widget__close"
              onClick={close}
              type="button"
            >
              <X aria-hidden size={20} strokeWidth={2.25} />
            </button>
          </header>

          <div className="help-widget__intro">
            <div aria-hidden className="help-widget__avatar">
              <MessageCircle size={28} strokeWidth={1.75} />
            </div>
            <p className="help-widget__intro-copy">{HELP_WIDGET_INTRO}</p>
          </div>

          <nav aria-label="Support links" className="help-widget__links">
            {HELP_WIDGET_LINKS.map((link) => (
              <Link
                key={link.href}
                className="help-widget__link"
                href={link.href}
                onClick={close}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="help-widget__actions">
            <a
              className="help-widget__action-btn"
              href={`mailto:${BRAND.email}?subject=Live%20Chat%20Support`}
              onClick={close}
            >
              <MessageCircle aria-hidden size={20} strokeWidth={2} />
              Live Chat
            </a>
            <a
              className="help-widget__action-btn"
              href={BRAND.phoneTel}
              onClick={close}
            >
              <Phone aria-hidden size={20} strokeWidth={2} />
              {BRAND.phoneDisplay}
            </a>
          </div>

          <div className="help-widget__hours">
            {HELP_WIDGET_HOURS.map((line) => (
              <p key={line}>{line}</p>
            ))}
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
      ) : null}

      <button
        aria-controls={open ? panelId : undefined}
        aria-expanded={open}
        aria-label={open ? "Close help" : "Open help"}
        className={`help-widget__trigger${open ? " help-widget__trigger--open" : ""}`}
        onClick={toggle}
        type="button"
      >
        <span className="help-widget__circle">
          <HelpFabIcon />
          <span className="help-widget__label">Help</span>
          {loading ? (
            <span
              aria-label="Loading - Help"
              aria-live="polite"
              className="help-widget__loading"
              role="alert"
            />
          ) : null}
        </span>
      </button>
    </div>
  );
}

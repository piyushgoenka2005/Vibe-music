"use client";

import { FormEvent, useCallback, useId, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useDialogA11y } from "@/hooks/useCartDrawerA11y";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { useIsClient } from "@/hooks/useIsClient";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface NotifyMeTarget {
  productId: string;
  productSlug: string;
  productName: string;
}

interface NotifyMeButtonProps extends NotifyMeTarget {
  className?: string;
  /** Compact card/carousel CTA vs larger PDP styling. */
  variant?: "card" | "pdp" | "pdp-primary" | "sticky" | "inline";
}

export default function NotifyMeButton({
  productId,
  productSlug,
  productName,
  className = "",
  variant = "card",
}: NotifyMeButtonProps) {
  const isClient = useIsClient();
  const userEmail = useAuthStore((s) => s.user?.email ?? "");
  const userName = useAuthStore((s) => s.user?.name ?? "");
  const showToast = useToastStore((s) => s.show);
  const formId = useId();

  const [open, setOpen] = useState(false);
  const [emailOverride, setEmailOverride] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const email = emailOverride ?? (open ? userEmail : "");
  const close = useCallback(() => setOpen(false), []);
  const dialogRef = useDialogA11y(open, close);
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/products/notify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          productId,
          productSlug,
          productName,
          ...(userName ? { name: userName } : {}),
        }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        showToast(data.error ?? "Unable to save your request.", "error");
        return;
      }
      setDone(true);
      showToast(
        data.message ?? "Thanks! We'll email you when this product is available.",
        "success"
      );
      window.setTimeout(() => {
        setOpen(false);
        setDone(false);
      }, 1200);
    } catch {
      showToast("Could not submit right now. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const buttonClass =
    variant === "inline"
      ? className
      : variant === "card"
        ? `cat-product-card__add ${className}`.trim()
        : variant === "sticky"
          ? `pdp-mobile-bar__cta pdp-mobile-bar__cta--cart pdp-mobile-bar__cta--notify ${className}`.trim()
          : variant === "pdp-primary"
            ? `pdp-btn pdp-btn--buy pdp-buy-now ${className}`.trim()
            : `pdp-btn pdp-btn--primary ${className}`.trim();

  const label =
    variant === "inline" ? (
      <span aria-hidden="true" className="notify-me-btn__glyph">
        N
      </span>
    ) : (
      "Notify me"
    );

  return (
    <>
      <button
        type="button"
        className={buttonClass}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setEmailOverride(null);
          setOpen(true);
        }}
        aria-label={`Notify me when ${productName} is available`}
        title={`Notify me when ${productName} is available`}
      >
        {label}
      </button>

      {isClient && open
        ? createPortal(
            <div
              className="notify-me-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${formId}-title`}
              onClick={close}
            >
              <div
                ref={dialogRef as RefObject<HTMLDivElement>}
                className="notify-me-modal__panel"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id={`${formId}-title`} className="notify-me-modal__title">
                  Notify me
                </h2>
                <p className="notify-me-modal__copy">
                  Get an email when <strong>{productName}</strong> is available
                  to buy.
                </p>
                <form className="notify-me-modal__form" onSubmit={onSubmit}>
                  <label className="visually-hidden" htmlFor={`${formId}-email`}>
                    Email
                  </label>
                  <input
                    id={`${formId}-email`}
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@email.com"
                    value={email}
                    onChange={(event) => setEmailOverride(event.target.value)}
                    disabled={submitting || done}
                  />
                  <div className="notify-me-modal__actions">
                    <button
                      type="button"
                      className="notify-me-modal__cancel"
                      onClick={close}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="notify-me-modal__submit"
                      disabled={submitting || done}
                    >
                      {done ? "Saved" : submitting ? "Saving…" : "Notify me"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

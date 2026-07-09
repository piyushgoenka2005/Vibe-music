"use client";

import { createPortal } from "react-dom";
import { useToastStore } from "@/store/toastStore";
import { useIsClient } from "@/hooks/useIsClient";
import "./toast.css";

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const mounted = useIsClient();

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div className="sw-toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`sw-toast sw-toast--${toast.type}`}
          role="status"
        >
          <span>{toast.message}</span>
          <button
            type="button"
            className="sw-toast__close"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}

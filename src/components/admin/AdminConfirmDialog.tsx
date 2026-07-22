"use client";

import { useCallback, type RefObject } from "react";
import { useDialogA11y } from "@/hooks/useCartDrawerA11y";

interface AdminConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);
  const dialogRef = useDialogA11y(open, handleCancel);

  if (!open) return null;

  return (
    <div
      className="admin-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
      onClick={handleCancel}
    >
      <div
        ref={dialogRef as RefObject<HTMLDivElement>}
        className="admin-confirm-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="admin-confirm-title" className="admin-confirm-dialog__title">
          {title}
        </h2>
        <p className="admin-confirm-dialog__description">{description}</p>
        <div className="admin-confirm-dialog__actions">
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            disabled={loading}
            onClick={handleCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`admin-btn ${variant === "danger" ? "admin-btn--danger" : "admin-btn--primary"}`}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

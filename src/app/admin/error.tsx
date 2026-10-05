"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ROUTES } from "@/lib/routes";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="admin-error admin-error--page" role="alert">
      <h1 className="admin-error__title">Something went wrong</h1>
      <p className="admin-error__message">
        The admin panel hit an unexpected error. Your data is safe — try again or return to the
        dashboard.
      </p>
      <div className="admin-error__actions">
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => reset()}>
          Try again
        </button>
        <Link href={ROUTES.admin} className="admin-btn admin-btn--secondary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

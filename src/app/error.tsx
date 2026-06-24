"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="storefront-page storefront-page--subtle error-page">
      <div className="error-page__inner">
        <p className="storefront-page__eyebrow">Error</p>
        <h1 className="error-page__title">Something went wrong</h1>
        <p className="error-page__lead">
          We hit an unexpected problem loading this page. You can try again or
          return to the homepage.
        </p>
        <div className="error-page__actions">
          <div className="error-page__btn-row">
            <button
              type="button"
              className="error-page__btn error-page__btn--primary"
              onClick={reset}
            >
              Try again
            </button>
            <Link
              href={ROUTES.home}
              className="error-page__btn error-page__btn--secondary"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

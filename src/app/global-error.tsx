"use client";

import { useEffect } from "react";
import { ROUTES } from "@/lib/routes";

export default function GlobalError({
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
    <html lang="en-IN">
      <body>
        <main className="storefront-page storefront-page--subtle error-page">
          <div className="error-page__inner">
            <p className="storefront-page__eyebrow">Error</p>
            <h1 className="error-page__title">Something went wrong</h1>
            <p className="error-page__lead">
              The application encountered an unexpected error.
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
                <a href={ROUTES.home} className="error-page__btn error-page__btn--secondary">
                  Back to home
                </a>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

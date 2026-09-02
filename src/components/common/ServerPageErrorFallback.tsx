"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/routes";

/**
 * Fallback UI shown when a server page component throws during rendering.
 * Wraps the page content in a try/catch to prevent the error boundary crash.
 */
export default function ServerPageErrorFallback({
  error,
  pageName,
}: {
  error?: unknown;
  pageName?: string;
}) {
  const message = error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <main className="storefront-page storefront-page--subtle">
      <div className="storefront-page__inner">
        <div className="error-page__inner">
          <p className="storefront-page__eyebrow">{pageName ?? "Page"} Error</p>
          <h1 className="error-page__title">Something went wrong</h1>
          <p className="error-page__lead">
            We were unable to load this page. Please try again or return to the homepage.
          </p>
          {process.env.NODE_ENV !== "production" ? (
            <pre
              style={{
                padding: 16,
                background: "#f5f5f5",
                borderRadius: 8,
                overflow: "auto",
                fontSize: 12,
                maxWidth: 600,
                margin: "0 auto 24px",
              }}
            >
              {message}
            </pre>
          ) : null}
          <div className="error-page__actions">
            <div className="error-page__btn-row">
              <button
                type="button"
                className="error-page__btn error-page__btn--primary"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
              <Link href={ROUTES.home} className="error-page__btn error-page__btn--secondary">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

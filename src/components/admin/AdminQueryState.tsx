"use client";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorState({ message, onRetry, isRetrying = false }: ErrorStateProps) {
  return (
    <div className="admin-error" role="alert">
      <p className="admin-error__message">{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          disabled={isRetrying}
          onClick={onRetry}
        >
          {isRetrying ? "Retrying…" : "Try again"}
        </button>
      ) : null}
    </div>
  );
}

export function MutationError({
  error,
  fallback = "Something went wrong. Please try again.",
}: {
  error: unknown;
  fallback?: string;
}) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : fallback;
  return (
    <p className="admin-error__message" role="alert" style={{ margin: "0.5rem 0 0" }}>
      {message}
    </p>
  );
}

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

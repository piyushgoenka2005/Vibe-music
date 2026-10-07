"use client";

import { useWebPushSubscription } from "@/hooks/useWebPushSubscription";

export default function WebPushOptIn() {
  const { status, error, subscribe, unsubscribe } = useWebPushSubscription();

  if (status === "unsupported" || status === "disabled") {
    return null;
  }

  const subscribed = status === "subscribed";
  const busy = status === "loading";

  return (
    <div className="acct__setting-row">
      <div className="acct__setting-info">
        <h4>Browser push notifications</h4>
        <p className="acct__setting-hint">
          {subscribed
            ? "You will receive order and deal alerts in this browser when push is enabled on the server."
            : "Get order updates and promotions in your browser — requires permission."}
        </p>
        {error ? (
          <p className="acct__setting-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        className="acct__btn acct__btn--secondary"
        disabled={busy}
        onClick={() => void (subscribed ? unsubscribe() : subscribe())}
      >
        {busy ? "Working…" : subscribed ? "Turn off push" : "Enable push"}
      </button>
    </div>
  );
}

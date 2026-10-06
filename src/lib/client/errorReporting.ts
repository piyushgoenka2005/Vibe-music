type ClientErrorPayload = {
  message: string;
  digest?: string;
  stack?: string;
  url?: string;
  boundary?: "route" | "global";
};

let lastReportedAt = 0;

/** Fire-and-forget client error relay — never throws. */
export function reportClientError(payload: ClientErrorPayload): void {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - lastReportedAt < 2000) return;
  lastReportedAt = now;

  const body = JSON.stringify({
    message: payload.message.slice(0, 500),
    digest: payload.digest?.slice(0, 128),
    stack: payload.stack?.slice(0, 2000),
    url: payload.url ?? window.location.pathname,
    boundary: payload.boundary ?? "route",
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/ops/client-error", blob);
      return;
    }
  } catch {
    /* sendBeacon optional */
  }

  void fetch("/api/ops/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => {
    /* non-fatal */
  });
}

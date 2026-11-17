/** Cross-tab "admin data changed" and "admin unauthorized" signals. */

const CHANNEL_NAME = "vibe-admin-sync";
const LOCAL_EVENT = "vibe:admin-data-changed";
export const LOCAL_UNAUTHORIZED_EVENT = "vibe:admin:unauthorized";
export const STORAGE_UNAUTHORIZED_KEY = "vibe_admin_unauthorized_ts";

let notifyChannel: BroadcastChannel | null = null;

function getNotifyChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!notifyChannel) {
    try {
      notifyChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      notifyChannel = null;
    }
  }
  return notifyChannel;
}

export function notifyAdminDataChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LOCAL_EVENT));
  const channel = getNotifyChannel();
  channel?.postMessage("changed");
}

export function notifyAdminUnauthorized(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("vibe_admin_session");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(LOCAL_UNAUTHORIZED_EVENT));

  const channel = getNotifyChannel();
  try {
    channel?.postMessage("unauthorized");
  } catch {
    /* ignore */
  }

  try {
    localStorage.setItem(STORAGE_UNAUTHORIZED_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function subscribeAdminDataChanged(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(LOCAL_EVENT, onChange);

  const handleMessage = (event: MessageEvent) => {
    if (event.data === "unauthorized") {
      try {
        sessionStorage.removeItem("vibe_admin_session");
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent(LOCAL_UNAUTHORIZED_EVENT));
    } else {
      onChange();
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_UNAUTHORIZED_KEY) {
      try {
        sessionStorage.removeItem("vibe_admin_session");
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent(LOCAL_UNAUTHORIZED_EVENT));
    }
  };

  window.addEventListener("storage", handleStorage);

  const channel =
    typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL_NAME);
  if (channel) {
    channel.addEventListener("message", handleMessage);
    channel.onmessage = handleMessage;
  }
  return () => {
    window.removeEventListener(LOCAL_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
    channel?.removeEventListener("message", handleMessage);
    channel?.close();
  };
}

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isAdminMutationRequest(input: RequestInfo | URL, init?: RequestInit): boolean {
  const method = (
    init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET")
  ).toUpperCase();
  if (!MUTATION_METHODS.has(method)) return false;
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const pathname = new URL(url, "http://local").pathname;
  return (
    pathname.startsWith("/api/admin/") && !/^\/api\/admin\/(login|logout)(\/|$)/.test(pathname)
  );
}

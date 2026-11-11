/** Cross-tab "admin data changed" signal — every admin query refetches when it fires. */

const CHANNEL_NAME = "vibe-admin-sync";
const LOCAL_EVENT = "vibe:admin-data-changed";

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

export function subscribeAdminDataChanged(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(LOCAL_EVENT, onChange);
  const channel =
    typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL_NAME);
  if (channel) {
    channel.onmessage = () => {
      onChange();
    };
  }
  return () => {
    window.removeEventListener(LOCAL_EVENT, onChange);
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

"use client";

import { useCallback, useEffect, useState } from "react";

type PushStatus = "unsupported" | "disabled" | "loading" | "subscribed" | "unsubscribed" | "error";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function useWebPushSubscription() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    try {
      const configRes = await fetch("/api/push/config");
      if (!configRes.ok) throw new Error("Unable to load push settings");
      const config = (await configRes.json()) as { enabled: boolean; publicKey: string | null };
      if (!config.enabled || !config.publicKey) {
        setStatus("disabled");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "unsubscribed");
      setError(null);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Push unavailable");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refresh();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const subscribe = useCallback(async () => {
    setError(null);
    setStatus("loading");
    try {
      const configRes = await fetch("/api/push/config");
      const config = (await configRes.json()) as { enabled: boolean; publicKey: string | null };
      if (!config.enabled || !config.publicKey) {
        setStatus("disabled");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("unsubscribed");
        setError("Notification permission was denied.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.publicKey) as BufferSource,
        }));

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Invalid browser subscription");
      }

      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        }),
      });
      if (!saveRes.ok) {
        const body = (await saveRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Unable to save subscription");
      }

      setStatus("subscribed");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Subscription failed");
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setStatus("loading");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unsubscribe failed");
    }
  }, []);

  return { status, error, subscribe, unsubscribe, refresh };
}

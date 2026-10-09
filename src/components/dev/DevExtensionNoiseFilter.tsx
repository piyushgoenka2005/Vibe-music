"use client";

import { useEffect } from "react";

const EXTENSION_NOISE =
  /save-page|Extension context invalidated|chrome-extension:|ObjectMultiplex|app-init-liveness|background-liveness/i;

function messageFromUnknown(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  return String(reason ?? "");
}

function isExtensionNoise(reason: unknown): boolean {
  const message = messageFromUnknown(reason);
  if (EXTENSION_NOISE.test(message)) return true;
  if (reason instanceof Error && reason.cause) {
    return isExtensionNoise(reason.cause);
  }
  return false;
}

/**
 * Suppresses known browser-extension errors in local dev (MetaMask, save-page menus).
 * Not an app bug — see contentscript.js in the console stack.
 */
export default function DevExtensionNoiseFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isExtensionNoise(event.reason)) {
        event.preventDefault();
      }
    };

    const onError = (event: ErrorEvent) => {
      if (isExtensionNoise(event.error) || EXTENSION_NOISE.test(event.message ?? "")) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}

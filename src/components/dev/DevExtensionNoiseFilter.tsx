"use client";

import { useEffect } from "react";
import {
  DEV_CONSOLE_SUPPRESSED,
  isSuppressedDevConsoleMessage,
  scheduleDevConsoleNoiseFilterRefresh,
} from "@/lib/dev/devConsoleNoise";

function messageFromUnknown(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  return String(reason ?? "");
}

function isExtensionNoise(reason: unknown): boolean {
  const message = messageFromUnknown(reason);
  if (isSuppressedDevConsoleMessage(message)) return true;
  if (reason instanceof Error && reason.cause) {
    return isExtensionNoise(reason.cause);
  }
  return false;
}

/**
 * Suppresses known browser-extension errors in local dev (MetaMask, save-page menus).
 * Console patching runs earlier via instrumentation-client; this handles window error events.
 */
export default function DevExtensionNoiseFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    scheduleDevConsoleNoiseFilterRefresh();

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isExtensionNoise(event.reason)) {
        event.preventDefault();
      }
    };

    const onError = (event: ErrorEvent) => {
      if (isExtensionNoise(event.error) || DEV_CONSOLE_SUPPRESSED.test(event.message ?? "")) {
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

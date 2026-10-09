"use client";

import { useEffect } from "react";
import { isBrowserExtensionConsoleNoise } from "@/lib/client/extensionConsoleNoise";
import { scheduleDevConsoleNoiseFilterRefresh } from "@/lib/dev/devConsoleNoise";

/**
 * Suppresses known browser-extension promise rejections in local dev
 * (e.g. "save-page" context menu, MetaMask multiplex). Not an app bug.
 */
export default function DevExtensionNoiseFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    scheduleDevConsoleNoiseFilterRefresh();

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isBrowserExtensionConsoleNoise(event.reason)) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", onUnhandledRejection);
  }, []);

  return null;
}

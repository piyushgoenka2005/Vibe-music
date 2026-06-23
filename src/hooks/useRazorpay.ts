"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const SCRIPT_LOAD_TIMEOUT_MS = 15_000;
const CHECKOUT_SESSION_TIMEOUT_MS = 15 * 60 * 1000;

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export type RazorpayCheckoutResult =
  | { status: "success"; response: RazorpaySuccessResponse }
  | { status: "cancelled" }
  | { status: "failed"; message: string };

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpaySuccessResponse) => void;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: RazorpayError }) => void) => void;
}

interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
}

interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function waitForScriptElement(script: HTMLScriptElement): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error("Razorpay SDK load timed out"));
    }, SCRIPT_LOAD_TIMEOUT_MS);

    const finish = (callback: () => void) => {
      window.clearTimeout(timeoutId);
      callback();
    };

    script.addEventListener(
      "load",
      () => {
        finish(() => resolve());
      },
      { once: true }
    );

    script.addEventListener(
      "error",
      () => {
        finish(() => reject(new Error("Failed to load Razorpay SDK")));
      },
      { once: true }
    );
  });
}

function injectRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay can only load in the browser"));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${RAZORPAY_SCRIPT_URL}"]`
  );

  if (existing) {
    return waitForScriptElement(existing);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.dataset.razorpayCheckout = "true";

    const timeoutId = window.setTimeout(() => {
      reject(new Error("Razorpay SDK load timed out"));
    }, SCRIPT_LOAD_TIMEOUT_MS);

    script.onload = () => {
      window.clearTimeout(timeoutId);
      resolve();
    };

    script.onerror = () => {
      window.clearTimeout(timeoutId);
      reject(new Error("Failed to load Razorpay SDK"));
    };

    document.head.appendChild(script);
  });
}

/** Shared loader — dedupes concurrent script requests across the app. */
export function ensureRazorpayScriptLoaded(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay can only load in the browser"));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (!scriptLoadPromise) {
    scriptLoadPromise = injectRazorpayScript().catch((error) => {
      scriptLoadPromise = null;
      throw error;
    });
  }

  return scriptLoadPromise;
}

export function preloadRazorpayCheckout(): void {
  if (typeof window === "undefined") return;
  void ensureRazorpayScriptLoaded().catch(() => undefined);

  for (const href of [
    "https://checkout.razorpay.com",
    "https://api.razorpay.com",
  ]) {
    if (document.querySelector(`link[data-razorpay-preconnect="${href}"]`)) {
      continue;
    }
    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = href;
    preconnect.dataset.razorpayPreconnect = href;
    document.head.appendChild(preconnect);
  }
}

export function useRazorpay() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const instanceRef = useRef<RazorpayInstance | null>(null);

  useEffect(() => {
    let cancelled = false;

    ensureRazorpayScriptLoaded()
      .then(() => {
        if (!cancelled) {
          setIsReady(true);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load Razorpay"
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openCheckout = useCallback(
    async (
      options: RazorpayCheckoutOptions
    ): Promise<RazorpayCheckoutResult> => {
      setIsLoading(true);
      setError(null);

      try {
        await ensureRazorpayScriptLoaded();

        if (!window.Razorpay) {
          throw new Error("Razorpay SDK unavailable");
        }

        if (!options.key?.startsWith("rzp_")) {
          throw new Error(
            "Payment gateway is not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to .env.local."
          );
        }

        const checkoutPromise = new Promise<RazorpayCheckoutResult>((resolve) => {
          let settled = false;

          const finish = (value: RazorpayCheckoutResult) => {
            if (settled) return;
            settled = true;
            setIsLoading(false);
            resolve(value);
          };

          const razorpay = new window.Razorpay!({
            ...options,
            handler: (response) => {
              options.handler(response);
              finish({ status: "success", response });
            },
            modal: {
              ...options.modal,
              ondismiss: () => {
                options.modal?.ondismiss?.();
                finish({ status: "cancelled" });
              },
            },
          });

          instanceRef.current = razorpay;

          razorpay.on("payment.failed", (response) => {
            const message =
              response.error.description ||
              response.error.reason ||
              "Payment failed. Please try another method.";
            setError(message);
            finish({ status: "failed", message });
          });

          try {
            razorpay.open();
          } catch (openError) {
            const message =
              openError instanceof Error
                ? openError.message
                : "Unable to open Razorpay checkout";
            setError(message);
            finish({ status: "failed", message });
          }
        });

        const timeoutPromise = new Promise<RazorpayCheckoutResult>((resolve) => {
          window.setTimeout(() => {
            const message = "Payment session timed out. Please try again.";
            setIsLoading(false);
            setError(message);
            resolve({ status: "failed", message });
          }, CHECKOUT_SESSION_TIMEOUT_MS);
        });

        return await Promise.race([checkoutPromise, timeoutPromise]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to open Razorpay checkout";
        setError(message);
        setIsLoading(false);
        return { status: "failed", message };
      }
    },
    []
  );

  return {
    isReady,
    isLoading,
    error,
    openCheckout,
  };
}

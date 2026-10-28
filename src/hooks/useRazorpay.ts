"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const SCRIPT_LOAD_TIMEOUT_MS = 15_000;
const CHECKOUT_SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const RAZORPAY_POLL_INTERVAL_MS = 50;

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
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
    /** Opens Razorpay on this method tab when supported. */
    method?: "card" | "netbanking" | "wallet" | "emi" | "upi";
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    backdrop_color?: string;
    hide_topbar?: boolean;
  };
  /** Prefer / limit instruments shown in Checkout (Standard Checkout config). */
  config?: {
    display?: {
      hide?: Array<{ method: string }>;
      preferences?: { show_default_blocks?: boolean };
    };
  };
  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
    escape?: boolean;
    animation?: boolean;
    backdropclose?: boolean;
  };
  retry?: {
    enabled?: boolean;
    max_count?: number;
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

function pollForRazorpayGlobal(timeoutMs = SCRIPT_LOAD_TIMEOUT_MS): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay can only load in the browser"));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    const tick = () => {
      if (window.Razorpay) {
        resolve();
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error("Razorpay SDK load timed out"));
        return;
      }
      window.setTimeout(tick, RAZORPAY_POLL_INTERVAL_MS);
    };

    tick();
  });
}

function markScriptLoaded(script: HTMLScriptElement): void {
  script.dataset.razorpayLoaded = "true";
}

function isScriptAlreadyLoaded(script: HTMLScriptElement): boolean {
  return (
    script.dataset.razorpayLoaded === "true" ||
    script.getAttribute("data-razorpay-loaded") === "true" ||
    script.getAttribute("data-nscript") === "afterInteractive"
  );
}

function waitForScriptElement(script: HTMLScriptElement): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      if (typeof window !== "undefined") {
        window.clearInterval(pollTimer);
        window.clearTimeout(timeoutId);
      }
      script.removeEventListener?.("load", onLoad);
      script.removeEventListener?.("error", onError);
    };

    const succeed = () => {
      if (settled) return;
      settled = true;
      markScriptLoaded(script);
      cleanup();
      resolve();
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const onLoad = () => {
      void pollForRazorpayGlobal(3000).then(succeed).catch(fail);
    };

    const onError = () => {
      fail(new Error("Failed to load Razorpay SDK"));
    };

    script.addEventListener?.("load", onLoad, { once: true });
    script.addEventListener?.("error", onError, { once: true });

    const pollTimer = window.setInterval(() => {
      if (window.Razorpay) {
        succeed();
      }
    }, RAZORPAY_POLL_INTERVAL_MS);

    const timeoutId = window.setTimeout(() => {
      if (window.Razorpay) {
        succeed();
      } else {
        fail(new Error("Razorpay SDK load timed out"));
      }
    }, SCRIPT_LOAD_TIMEOUT_MS);
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
    `script[src="${RAZORPAY_SCRIPT_URL}"]`,
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
      markScriptLoaded(script);
      void pollForRazorpayGlobal().then(resolve).catch(reject);
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

  for (const href of ["https://checkout.razorpay.com", "https://api.razorpay.com"]) {
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
          setError(err instanceof Error ? err.message : "Failed to load Razorpay");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openCheckout = useCallback(
    async (options: RazorpayCheckoutOptions): Promise<RazorpayCheckoutResult> => {
      setIsLoading(true);
      setError(null);

      try {
        await ensureRazorpayScriptLoaded();

        if (!window.Razorpay) {
          throw new Error("Razorpay SDK unavailable");
        }

        if (
          !options.key?.startsWith("rzp_") ||
          options.key.toLowerCase().includes("your_") ||
          options.key.toLowerCase().includes("placeholder")
        ) {
          throw new Error(
            "Payment gateway is not configured. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to .env.local.",
          );
        }

        const checkoutPromise = new Promise<RazorpayCheckoutResult>((resolve) => {
          let settled = false;
          let lastFailureReason: string | null = null;

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
              confirm_close: true,
              ...options.modal,
              ondismiss: () => {
                options.modal?.ondismiss?.();
                if (lastFailureReason) {
                  finish({ status: "failed", message: lastFailureReason });
                } else {
                  finish({ status: "cancelled" });
                }
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
            lastFailureReason = message;
            // Do NOT call finish() here. The Razorpay modal stays open and allows the
            // customer to retry or choose another payment method. Only upon dismissal
            // (modal.ondismiss) without a successful payment does the flow finish.
          });

          try {
            razorpay.open();
          } catch (openError) {
            const message =
              openError instanceof Error ? openError.message : "Unable to open Razorpay checkout";
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
        const message = err instanceof Error ? err.message : "Unable to open Razorpay checkout";
        setError(message);
        setIsLoading(false);
        return { status: "failed", message };
      }
    },
    [],
  );

  return {
    isReady,
    isLoading,
    error,
    openCheckout,
  };
}

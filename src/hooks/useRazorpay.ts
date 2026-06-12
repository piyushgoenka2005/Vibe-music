"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

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

function loadRazorpayScript(): Promise<void> {
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
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay SDK"))
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const instanceRef = useRef<RazorpayInstance | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadRazorpayScript()
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
    ): Promise<RazorpaySuccessResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        await loadRazorpayScript();

        if (!window.Razorpay) {
          throw new Error("Razorpay SDK unavailable");
        }

        return await new Promise<RazorpaySuccessResponse | null>((resolve) => {
          const razorpay = new window.Razorpay!({
            ...options,
            handler: (response) => {
              setIsLoading(false);
              options.handler(response);
              resolve(response);
            },
            modal: {
              ...options.modal,
              ondismiss: () => {
                setIsLoading(false);
                options.modal?.ondismiss?.();
                resolve(null);
              },
            },
          });

          instanceRef.current = razorpay;

          razorpay.on("payment.failed", (response) => {
            setIsLoading(false);
            setError(response.error.description || "Payment failed");
            resolve(null);
          });

          razorpay.open();
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to open Razorpay checkout";
        setError(message);
        setIsLoading(false);
        return null;
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

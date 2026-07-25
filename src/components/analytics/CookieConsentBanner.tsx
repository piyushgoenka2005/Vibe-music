"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ANALYTICS_CONSENT_KEY,
  isAnalyticsEnabled,
} from "@/lib/analytics/config";
import {
  denyAnalyticsConsent,
  grantAnalyticsConsent,
} from "@/lib/analytics/gtag";
import "@/components/analytics/cookie-consent.css";

type ConsentState = "unknown" | "granted" | "denied";

const CONSENT_CHANGE_EVENT = "vibe-analytics-consent";

function readConsent(): ConsentState {
  if (typeof window === "undefined") return "unknown";
  try {
    const value = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (value === "granted") return "granted";
    if (value === "denied") return "denied";
  } catch {
    /* ignore */
  }
  return "unknown";
}

function writeConsent(value: "granted" | "denied") {
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

function subscribeConsent(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
  };
}

const subscribeNowhere = () => () => {};

export default function CookieConsentBanner() {
  const isClient = useSyncExternalStore(subscribeNowhere, () => true, () => false);
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => "unknown");

  useEffect(() => {
    if (!isClient || !isAnalyticsEnabled()) return;
    if (consent === "granted") {
      grantAnalyticsConsent();
      return;
    }
    if (consent === "denied") {
      denyAnalyticsConsent();
    }
  }, [isClient, consent]);

  function accept(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    writeConsent("granted");
    grantAnalyticsConsent();
  }

  function decline(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    writeConsent("denied");
    denyAnalyticsConsent();
  }

  if (!isClient || !isAnalyticsEnabled() || consent !== "unknown") {
    return null;
  }

  const banner = (
    <div
      className="cookie-consent"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
    >
      <div className="cookie-consent__inner">
        <p id="cookie-consent-title" className="cookie-consent__title">
          Analytics &amp; experience
        </p>
        <p className="cookie-consent__text">
          We use privacy-friendly Google Analytics to understand how musicians shop
          on Vibe Music and improve our store. No ad tracking.{" "}
          <Link href="/pages/cookies" className="cookie-consent__link">
            Cookie policy
          </Link>
        </p>
        <div className="cookie-consent__actions">
          <button
            type="button"
            className="cookie-consent__btn"
            onClick={decline}
          >
            Decline
          </button>
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--primary"
            onClick={accept}
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(banner, document.body);
}

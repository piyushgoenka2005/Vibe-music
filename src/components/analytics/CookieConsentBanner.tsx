"use client";

import { useEffect, useState } from "react";
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

export default function CookieConsentBanner() {
  const [consent, setConsent] = useState<ConsentState>(() => readConsent());
  const [visible, setVisible] = useState(
    () => isAnalyticsEnabled() && readConsent() === "unknown"
  );

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    if (consent === "granted") {
      grantAnalyticsConsent();
      return;
    }
    if (consent === "denied") {
      denyAnalyticsConsent();
    }
  }, [consent]);

  function accept() {
    try {
      localStorage.setItem(ANALYTICS_CONSENT_KEY, "granted");
    } catch {
      /* ignore */
    }
    grantAnalyticsConsent();
    setConsent("granted");
    setVisible(false);
  }

  function decline() {
    try {
      localStorage.setItem(ANALYTICS_CONSENT_KEY, "denied");
    } catch {
      /* ignore */
    }
    denyAnalyticsConsent();
    setConsent("denied");
    setVisible(false);
  }

  if (!isAnalyticsEnabled() || !visible || consent !== "unknown") {
    return null;
  }

  return (
    <div className="cookie-consent" role="dialog" aria-labelledby="cookie-consent-title">
      <div className="cookie-consent__inner">
        <p id="cookie-consent-title" className="cookie-consent__title">
          Analytics &amp; experience
        </p>
        <p className="cookie-consent__text">
          We use privacy-friendly Google Analytics to understand how musicians shop
          on Vibe Music and improve our store. No ad tracking.{" "}
          <a href="/pages/cookies" className="cookie-consent__link">
            Cookie policy
          </a>
        </p>
        <div className="cookie-consent__actions">
          <button type="button" className="cookie-consent__btn" onClick={decline}>
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
}

"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, Mail } from "lucide-react";
import { useToastStore } from "@/store/toastStore";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FooterNewsletter() {
  const showToast = useToastStore((state) => state.show);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }
    };
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();

    if (!EMAIL_PATTERN.test(value)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    setEmail("");
    setSubmitted(true);
    showToast("Thanks for subscribing to Vibe Music updates!", "success");

    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current);
    }
    resetTimer.current = window.setTimeout(() => {
      setSubmitted(false);
    }, 2400);
  }

  return (
    <section className="site-footer__newsletter" aria-labelledby="footer-newsletter-heading">
      <div className="site-footer__newsletter-inner">
        <h2 id="footer-newsletter-heading" className="visually-hidden">
          Newsletter signup
        </h2>
        <form className="site-footer__newsletter-form" onSubmit={onSubmit}>
          <div className="site-footer__newsletter-field">
            <label className="visually-hidden" htmlFor="footer-newsletter-email">
              Your email
            </label>
            <input
              id="footer-newsletter-email"
              type="email"
              name="email"
              className="site-footer__newsletter-input"
              placeholder="Your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={submitted}
            />
            <Mail
              className="site-footer__newsletter-icon"
              size={18}
              aria-hidden="true"
            />
          </div>
          <button
            type="submit"
            className={`site-footer__newsletter-submit${submitted ? " site-footer__newsletter-submit--success" : ""}`}
            disabled={submitted}
          >
            {submitted ? (
              <>
                <Check size={18} aria-hidden />
                Subscribed!
              </>
            ) : (
              "Subscribe"
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

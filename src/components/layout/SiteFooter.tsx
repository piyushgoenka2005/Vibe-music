"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import { SOCIAL_LINKS } from "@/lib/socialLinks";
import FooterAccordion, {
  type FooterAccordionSection,
} from "@/components/layout/FooterAccordion";
import FooterClock from "@/components/layout/FooterClock";
import FooterProductsPanel from "@/components/layout/FooterProductsPanel";
import { useToastStore } from "@/store/toastStore";
import {
  submitNewsletterToWeb3Forms,
  isWeb3FormsConfigured,
} from "@/lib/web3formsClient";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FOOTER_SECTIONS: FooterAccordionSection[] = [
  {
    id: "service",
    label: "01 / Customer Service",
    links: [
      { label: "Track your order", href: ROUTES.trackOrder },
      { label: "Contact support", href: ROUTES.contact },
      ...(BRAND.phoneTel
        ? [{ label: `Call ${BRAND.phoneDisplay}`, href: `tel:${BRAND.phoneTel}` }]
        : [{ label: `Email ${BRAND.email}`, href: `mailto:${BRAND.email}` }]),
      { label: "Shipping & delivery", href: ROUTES.page("shipping") },
      { label: "Returns & exchanges", href: ROUTES.page("returns") },
    ],
  },
  {
    id: "legal",
    label: "02 / Legal",
    links: [
      { label: "Terms & conditions", href: ROUTES.page("terms") },
      { label: "Privacy policy", href: ROUTES.page("privacy") },
      { label: "Cookie policy", href: ROUTES.page("cookies") },
      { label: "Contact", href: ROUTES.contact },
    ],
  },
  {
    id: "follow",
    label: "03 / Follow",
    links: [
      { label: "Instagram", href: SOCIAL_LINKS.instagram, external: true },
      { label: "YouTube", href: SOCIAL_LINKS.youtube, external: true },
      { label: "Facebook", href: SOCIAL_LINKS.facebook, external: true },
      { label: "LinkedIn", href: SOCIAL_LINKS.linkedin, external: true },
    ],
  },
];

export default function SiteFooter() {
  const pathname = usePathname() ?? "";
  const isLandingPage = pathname === "/";
  const showToast = useToastStore((state) => state.show);
  const footerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const year = new Date().getFullYear();

  useEffect(() => {
    const panel = panelRef.current;
    const footer = footerRef.current;
    const spacer = spacerRef.current;
    if (!panel || !footer || !spacer) return;

    const shell = footer.querySelector<HTMLElement>(".site-footer__shell");

    const syncSpacer = () => {
      const height = Math.max(panel.offsetHeight, panel.scrollHeight);
      if (height > 0) {
        spacer.style.height = `${height}px`;
      }
    };

    syncSpacer();

    const resizeObserver = new ResizeObserver(syncSpacer);
    resizeObserver.observe(panel);

    const readyObserver = new IntersectionObserver(
      ([entry]) => {
        const isReady = Boolean(entry?.isIntersecting);
        panel.classList.toggle("is-ready", isReady);
        if (isReady) {
          syncSpacer();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px 0px 0px" }
    );

    readyObserver.observe(shell ?? footer);

    const updateInteractive = () => {
      if (!shell) return;
      const shellRect = shell.getBoundingClientRect();
      /* Trending becomes interactive only after Inside Vibe Music has scrolled mostly off */
      const panelInteractive = shellRect.bottom <= window.innerHeight * 0.2;
      panel.classList.toggle("is-interactive", panelInteractive);
    };

    let scrollFrame = 0;
    const onScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        updateInteractive();
      });
    };

    updateInteractive();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", syncSpacer);
    window.addEventListener("resize", updateInteractive);

    return () => {
      resizeObserver.disconnect();
      readyObserver.disconnect();
      if (scrollFrame) {
        window.cancelAnimationFrame(scrollFrame);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", syncSpacer);
      window.removeEventListener("resize", updateInteractive);
      panel.classList.remove("is-ready", "is-interactive");
      spacer.style.height = "";
    };
  }, []);

  async function onNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    if (!marketingConsent) {
      showToast("Please accept marketing communications to join the list.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          marketing: marketingConsent,
        }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        showToast(data.error ?? "Unable to subscribe right now.", "error");
        return;
      }

      if (isWeb3FormsConfigured()) {
        try {
          await submitNewsletterToWeb3Forms({
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            email: trimmedEmail,
            marketingConsent,
          });
        } catch (web3Error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[newsletter] Web3Forms notification failed:", web3Error);
          }
        }
      }

      setFirstName("");
      setLastName("");
      setEmail("");
      showToast(
        data.message ?? "You're subscribed! We'll email you about new products and deals.",
        "success"
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not sign you up. Please try again.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/*
        Layered scroll-reveal (desktop + mobile):
        1) Inside Vibe Music shell scrolls over the fixed Trending panel
        2) Spacer creates room to reveal Trending underneath
        Panel stays behind the shell until the shell scrolls away.
      */}
      <footer
        ref={footerRef}
        className="site-footer site-footer--layered"
        data-vibe-section="footer"
      >
        <div className="site-footer__shell">
          <div className="site-footer__shell-inner">
            <section
              id="newsletter"
              className="site-footer-newsletter"
              aria-labelledby="footer-newsletter-title"
            >
              <div className="site-footer-newsletter__header">
                <h2 id="footer-newsletter-title" className="site-footer-newsletter__title">
                  Inside Vibe Music
                </h2>
                <p className="site-footer-newsletter__body">
                  Subscribe for the latest product drops, restock alerts, and exclusive
                  deals from India&apos;s trusted gear destination.
                </p>
              </div>

              <form className="site-footer-newsletter__form" onSubmit={onNewsletterSubmit}>
                <input
                  type="checkbox"
                  name="botcheck"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="site-footer-newsletter__honeypot"
                />
                <div className="site-footer-newsletter__row">
                  <input
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    placeholder="FIRST NAME"
                    className="site-footer-newsletter__input"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    disabled={submitting}
                  />
                  <input
                    type="text"
                    name="lastName"
                    autoComplete="family-name"
                    placeholder="LAST NAME"
                    className="site-footer-newsletter__input"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="site-footer-newsletter__row site-footer-newsletter__row--action">
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="EMAIL ADDRESS"
                    className="site-footer-newsletter__input site-footer-newsletter__input--email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={submitting}
                    suppressHydrationWarning
                  />
                  <button
                    type="submit"
                    className="site-footer-newsletter__submit"
                    disabled={submitting}
                  >
                    {submitting ? "Signing up…" : "Sign up"}
                  </button>
                </div>
                <label className="site-footer-newsletter__consent">
                  <input
                    type="checkbox"
                    name="marketing"
                    checked={marketingConsent}
                    onChange={(event) => setMarketingConsent(event.target.checked)}
                    disabled={submitting}
                  />
                  <span>Email me about new gear, restocks, and Vibe Music updates.</span>
                </label>
              </form>
            </section>

            <div className="site-footer__grid">
              <FooterAccordion sections={FOOTER_SECTIONS} />

              <div className="site-footer-base">
                <div className="site-footer-base__item">
                  ©{year} /{" "}
                  <Link href={ROUTES.home} title={BRAND.name}>
                    {BRAND.name}
                  </Link>
                </div>
                <div className="site-footer-base__item">
                  <FooterClock />
                </div>
                <div className="site-footer-base__item site-footer-base__item--tagline">
                  Pro Audio · Instruments · Studio Gear
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={spacerRef} className="site-footer__panel-spacer" aria-hidden />
      </footer>

      <FooterProductsPanel ref={panelRef} />
    </>
  );
}

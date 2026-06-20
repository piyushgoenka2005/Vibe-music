"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import { SOCIAL_LINKS } from "@/lib/socialLinks";
import FooterAccordion, {
  type FooterAccordionSection,
} from "@/components/layout/FooterAccordion";
import FooterClock from "@/components/layout/FooterClock";
import FooterProductsPanel from "@/components/layout/FooterProductsPanel";
import { useToastStore } from "@/store/toastStore";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FOOTER_SECTIONS: FooterAccordionSection[] = [
  {
    id: "service",
    label: "01 / Customer Service",
    links: [
      { label: "Track your order", href: ROUTES.trackOrder },
      { label: "Contact support", href: `mailto:${BRAND.email}` },
      { label: "Shipping & delivery", href: `${ROUTES.search}?q=shipping` },
      { label: "Returns & exchanges", href: `${ROUTES.search}?q=returns` },
    ],
  },
  {
    id: "legal",
    label: "02 / Legal",
    links: [
      { label: "Terms & conditions", href: `${ROUTES.search}?q=terms` },
      { label: "Privacy policy", href: `${ROUTES.search}?q=privacy` },
      { label: "Cookie policy", href: `${ROUTES.search}?q=cookies` },
      { label: "Contact", href: `mailto:${BRAND.email}` },
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
  const showToast = useToastStore((state) => state.show);
  const footerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const year = new Date().getFullYear();

  useEffect(() => {
    const panel = panelRef.current;
    const footer = footerRef.current;
    const spacer = spacerRef.current;
    if (!panel || !footer || !spacer) return;

    const newsletterShell = footer.querySelector<HTMLElement>(
      ".site-footer__shell:not(.site-footer__shell--links)"
    );
    const linksShell = footer.querySelector<HTMLElement>(".site-footer__shell--links");

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
      { threshold: 0.12, rootMargin: "0px" }
    );

    readyObserver.observe(newsletterShell ?? footer);

    const updateInteractive = () => {
      const targetShell = linksShell ?? newsletterShell;
      if (!targetShell) return;
      const shellRect = targetShell.getBoundingClientRect();
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
    window.addEventListener("resize", updateInteractive);

    return () => {
      resizeObserver.disconnect();
      readyObserver.disconnect();
      if (scrollFrame) {
        window.cancelAnimationFrame(scrollFrame);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateInteractive);
    };
  }, []);

  function onNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();

    if (!EMAIL_PATTERN.test(value)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    setEmail("");
    showToast("Thanks for joining the Vibe Music list!", "success");
  }

  return (
    <>
      <FooterProductsPanel ref={panelRef} />

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
                Join the list for launch drops, studio tips, and exclusive offers from India&apos;s
                trusted gear destination.
              </p>
            </div>

            <form className="site-footer-newsletter__form" onSubmit={onNewsletterSubmit}>
              <div className="site-footer-newsletter__row">
                <input
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="FIRST NAME"
                  className="site-footer-newsletter__input"
                />
                <input
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="LAST NAME"
                  className="site-footer-newsletter__input"
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
                />
                <button type="submit" className="site-footer-newsletter__submit">
                  Sign up
                </button>
              </div>
              <label className="site-footer-newsletter__consent">
                <input type="checkbox" name="marketing" defaultChecked />
                <span>Vibe Music can contact me about promotions and gear guides.</span>
              </label>
            </form>
          </section>
        </div>
      </div>

        <div ref={spacerRef} className="site-footer__panel-spacer" aria-hidden />

        <div className="site-footer__shell site-footer__shell--links">
          <div className="site-footer__shell-inner">
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
      </footer>
    </>
  );
}

"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import FooterRollText from "@/components/layout/FooterRollText";

export type FooterAccordionSection = {
  id: string;
  label: string;
  links: { label: string; href: string; external?: boolean }[];
  noteLines?: string[];
};

interface FooterAccordionProps {
  sections: FooterAccordionSection[];
}

const DESKTOP_FOOTER_QUERY = "(min-width: 1024px)";

function subscribeDesktop(onStoreChange: () => void) {
  const media = window.matchMedia(DESKTOP_FOOTER_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_FOOTER_QUERY).matches;
}

function getServerDesktopSnapshot() {
  return false;
}

function useIsDesktopFooter() {
  return useSyncExternalStore(subscribeDesktop, getDesktopSnapshot, getServerDesktopSnapshot);
}

export default function FooterAccordion({ sections }: FooterAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const isDesktop = useIsDesktopFooter();

  return (
    <div className="site-footer-accordion-group">
      {sections.map((section) => {
        const isOpen = isDesktop || openId === section.id;

        return (
          <div key={section.id} className="site-footer-accordion">
            <button
              type="button"
              className="site-footer-accordion__button"
              aria-expanded={isOpen}
              onClick={() => {
                if (isDesktop) return;
                setOpenId(isOpen ? null : section.id);
              }}
            >
              <span className="site-footer-accordion__label">{section.label}</span>
              <span className="site-footer-accordion__icon" aria-hidden />
            </button>
            <div className="site-footer-accordion__content" data-open={isOpen ? "true" : "false"}>
              <ul className="site-footer-accordion__list">
                {section.links.map((link) => {
                  const isNativeLink =
                    link.external ||
                    link.href.startsWith("mailto:") ||
                    link.href.startsWith("tel:");

                  return (
                    <li key={`${section.id}-${link.label}`}>
                      {isNativeLink ? (
                        <a
                          href={link.href}
                          target={link.external ? "_blank" : undefined}
                          rel={link.external ? "noopener noreferrer" : undefined}
                          className="site-footer-accordion__link"
                        >
                          <ArrowUpRight size={12} strokeWidth={2.5} aria-hidden />
                          <FooterRollText>{link.label}</FooterRollText>
                        </a>
                      ) : (
                        <Link href={link.href} className="site-footer-accordion__link">
                          <ArrowUpRight size={12} strokeWidth={2.5} aria-hidden />
                          <FooterRollText>{link.label}</FooterRollText>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
              {section.noteLines?.length ? (
                <div className="site-footer-accordion__note">
                  {section.noteLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

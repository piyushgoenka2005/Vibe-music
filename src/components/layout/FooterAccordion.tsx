"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import FooterRollText from "@/components/layout/FooterRollText";

export type FooterAccordionSection = {
  id: string;
  label: string;
  links: { label: string; href: string; external?: boolean }[];
};

interface FooterAccordionProps {
  sections: FooterAccordionSection[];
}

export default function FooterAccordion({ sections }: FooterAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");

    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

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
            <div
              className="site-footer-accordion__content"
              data-open={isOpen ? "true" : "false"}
            >
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

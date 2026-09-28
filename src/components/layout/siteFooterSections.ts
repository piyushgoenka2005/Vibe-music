import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import { SOCIAL_LINKS } from "@/lib/socialLinks";
import type { FooterAccordionSection } from "@/components/layout/FooterAccordion";
import type { PublicLegalInfo } from "@/types/publicLegal";

export function buildFooterSections(legal: PublicLegalInfo): FooterAccordionSection[] {
  const legalNoteLines = [
    legal.legalName,
    legal.address,
    legal.gstin ? `GSTIN: ${legal.gstin}` : "",
  ].filter(Boolean);

  return [
    {
      id: "service",
      label: "01 / Customer Service",
      links: [
        { label: "Shop brands", href: ROUTES.brands },
        { label: "Track your order", href: ROUTES.trackOrder },
        { label: "Contact support", href: ROUTES.contact },
        ...(BRAND.phoneTel
          ? [{ label: `Call ${BRAND.phoneDisplay}`, href: `tel:${BRAND.phoneTel}` }]
          : [{ label: `Email ${BRAND.email}`, href: `mailto:${BRAND.email}` }]),
        ...(BRAND.whatsappUrl
          ? [{ label: "Chat on WhatsApp", href: BRAND.whatsappUrl, external: true }]
          : []),
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
      noteLines: legalNoteLines.length > 0 ? legalNoteLines : undefined,
    },
    {
      id: "follow",
      label: "03 / Follow",
      links: [
        { label: "Instagram", href: SOCIAL_LINKS.instagram, external: true },
        { label: "YouTube", href: SOCIAL_LINKS.youtube, external: true },
        { label: "Facebook", href: SOCIAL_LINKS.facebook, external: true },
        { label: "LinkedIn", href: SOCIAL_LINKS.linkedin, external: true },
        ...(BRAND.whatsappUrl
          ? [{ label: "WhatsApp", href: BRAND.whatsappUrl, external: true }]
          : []),
      ],
    },
  ];
}

import { STOREFRONT_PROGRAMS } from "@/data/storefrontPrograms";
import { BRAND } from "@/lib/brand";
import {
  CANONICAL_BUSINESS_ADDRESS,
  GRIEVANCE_OFFICER_EMAIL,
  GRIEVANCE_OFFICER_NAME,
} from "@/lib/brand/businessIdentity";
import { ROUTES } from "@/lib/routes";
import { SOCIAL_LINKS } from "@/lib/socialLinks";
import type { FooterAccordionSection } from "@/components/layout/FooterAccordion";
import type { PublicLegalInfo } from "@/types/publicLegal";

/** Footer "04 / Follow" social links — off until profiles are finalized. */
const FOOTER_FOLLOW_SECTION_ENABLED = false;

export function buildFooterSections(legal: PublicLegalInfo): FooterAccordionSection[] {
  const legalNoteLines = [
    legal.legalName || BRAND.name,
    legal.address || CANONICAL_BUSINESS_ADDRESS,
    legal.gstin ? `GSTIN: ${legal.gstin}` : "",
    `Grievance officer: ${GRIEVANCE_OFFICER_NAME} (${GRIEVANCE_OFFICER_EMAIL})`,
  ].filter(Boolean);

  return [
    {
      id: "programs",
      label: "01 / Programs",
      links: [
        { label: "All programs", href: ROUTES.programs },
        ...STOREFRONT_PROGRAMS.map((program) => ({
          label: program.title,
          href: program.href,
        })),
      ],
    },
    {
      id: "service",
      label: "02 / Customer Service",
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
      label: "03 / Legal",
      links: [
        { label: "Terms & conditions", href: ROUTES.page("terms") },
        { label: "Privacy policy", href: ROUTES.page("privacy") },
        { label: "Cookie policy", href: ROUTES.page("cookies") },
        { label: "Contact", href: ROUTES.contact },
      ],
      noteLines: legalNoteLines.length > 0 ? legalNoteLines : undefined,
    },
    ...(FOOTER_FOLLOW_SECTION_ENABLED
      ? [
          {
            id: "follow",
            label: "04 / Follow",
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
        ]
      : []),
  ];
}

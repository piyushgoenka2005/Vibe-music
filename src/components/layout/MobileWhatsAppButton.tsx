"use client";

import { BRAND } from "@/lib/brand";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import "@/styles/mobile-whatsapp-button.css";

export default function MobileWhatsAppButton() {
  const href = BRAND.whatsappMobileUrl || BRAND.whatsappUrl;
  if (!href) return null;

  return (
    <a
      href={href}
      className="mobile-whatsapp-btn"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Vibe Music on WhatsApp"
    >
      <WhatsAppIcon size={22} className="mobile-whatsapp-btn__icon" />
    </a>
  );
}

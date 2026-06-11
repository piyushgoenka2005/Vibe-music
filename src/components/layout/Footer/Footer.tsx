import MarkupBlock from "@/components/layout/Header/MarkupBlock";
import FooterBottom from "./FooterBottom";
import FooterLinks from "./FooterLinks";
import FooterSocials from "./FooterSocials";
import {
  CANDY_MARKUP,
  CONTACT_MARKUP,
  FOOTER_OPEN_MARKUP,
  NEW_GEAR_DAY_MARKUP,
} from "./generated/markup";

const NAV_CLOSE_MARKUP = "</nav>";

export default function Footer() {
  return (
    <div data-vibe-section="footer" className="vibe-html-section">
      <MarkupBlock html={FOOTER_OPEN_MARKUP} />
      <MarkupBlock html={NEW_GEAR_DAY_MARKUP} />
      <MarkupBlock html={CANDY_MARKUP} />
      <MarkupBlock html={CONTACT_MARKUP} />
      <FooterSocials />
      <FooterLinks />
      <MarkupBlock html={NAV_CLOSE_MARKUP} />
      <FooterBottom />
    </div>
  );
}

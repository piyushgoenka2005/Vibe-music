import MarkupBlock from "@/components/layout/Header/MarkupBlock";
import { SOCIAL_MARKUP } from "./generated/markup";

export default function FooterSocials() {
  return <MarkupBlock html={SOCIAL_MARKUP} />;
}
